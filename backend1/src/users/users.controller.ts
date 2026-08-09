import {
  Controller, Get, Post, Put, Delete, Body, UseGuards, Req, Query, Res,
  UploadedFile, UseInterceptors, Param, ParseUUIDPipe, NotFoundException, BadRequestException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import type { Response } from 'express';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req) {
    return this.usersService.findOne(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  updateProfile(@Req() req, @Body() updateData: any) {
    return this.usersService.update(req.user.id, updateData);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/rate')
  rateDriver(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('rating') rating: number,
    @Req() req: any,
  ) {
    if (req.user.id === id) {
      throw new BadRequestException('You cannot rate yourself');
    }
    return this.usersService.rateUser(id, rating);
  }

  @UseGuards(JwtAuthGuard)
  @Post('onesignal')
  updateOneSignalId(@Req() req, @Body('onesignal_id') onesignalId: string) {
    return this.usersService.update(req.user.id, { onesignal_id: onesignalId });
  }

  @UseGuards(JwtAuthGuard)
  @Post('avatar')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const folder = './uploads/profiles';
        if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
        cb(null, folder);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
      }
    })
  }))
  uploadAvatar(@Req() req, @UploadedFile() file: Express.Multer.File) {
    return this.usersService.update(req.user.id, { profile_picture: `uploads/profiles/${file.filename}` });
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify-document')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        let folder = './uploads';
        if (req.body.type === 'driver') folder = './uploads/driver_licenses';
        else if (req.body.type === 'student') folder = './uploads/student_ids';
        if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
        cb(null, folder);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `doc-${uniqueSuffix}${extname(file.originalname)}`);
      }
    })
  }))
  uploadVerificationDocument(@Req() req, @UploadedFile() file: Express.Multer.File, @Body('type') type: string) {
    const subFolder = type === 'driver' ? 'driver_licenses' : type === 'student' ? 'student_ids' : '';
    const path = subFolder ? `uploads/${subFolder}/${file.filename}` : `uploads/${file.filename}`;

    if (type === 'student') {
      return this.usersService.update(req.user.id, {
        student_id_url: path,
        student_verification_status: 'pending'
      });
    } else {
      return this.usersService.update(req.user.id, {
        verification_docs_url: path,
        driver_verification_status: 'pending'
      });
    }
  }

  // Admin: Create user
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  async createUser(@Body() body: any) {
    const bcrypt = require('bcrypt');
    const password_hash = body.password
      ? await bcrypt.hash(body.password, 10)
      : await bcrypt.hash(Math.random().toString(36).slice(2), 10);
    const { password, ...rest } = body;
    return this.usersService.create({ ...rest, password_hash, is_email_verified: true });
  }

  // Admin: Get one user
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get(':id')
  async findOneAdmin(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  // Admin: Update any user
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Put(':id')
  async updateUser(@Param('id', ParseUUIDPipe) id: string, @Body() updateData: any) {
    const { password_hash, email_verification_code, ...safeData } = updateData;
    const user = await this.usersService.findOne(id);
    if (!user) throw new NotFoundException('User not found');
    return this.usersService.update(id, safeData);
  }

  // Admin: List users with pagination + filters
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get()
  async findAll(
    @Query('_start') start: string,
    @Query('_end') end: string,
    @Query('_sort') sort: string,
    @Query('_order') order: string,
    @Query('q') q: string,
    @Query('driver_verification_status') driverStatus: string,
    @Query('student_verification_status') studentStatus: string,
    @Res() res: Response,
  ) {
    const skip = parseInt(start) || 0;
    const take = Math.max(1, (parseInt(end) || 25) - skip);
    const sortField = sort || 'created_at';
    const orderDir = (order?.toUpperCase() as 'ASC' | 'DESC') || 'DESC';

    try {
      const [data, total] = await this.usersService.findAllFiltered({
        skip, take, sort: sortField, order: orderDir, q, driverStatus, studentStatus,
      });
      res.set('Access-Control-Expose-Headers', 'Content-Range');
      res.set('Content-Range', `users ${skip}-${skip + data.length}/${total}`);
      return res.json(data);
    } catch (err: any) {
      console.error('[USERS] findAllFiltered failed:', err?.message || err);
      // Fallback to a tolerant query so the admin panel doesn't break
      try {
        const [data, total] = await this.usersService.findAllAndCount(skip, take, { [sortField]: orderDir });
        res.set('Access-Control-Expose-Headers', 'Content-Range');
        res.set('Content-Range', `users ${skip}-${skip + data.length}/${total}`);
        return res.json(data);
      } catch (err2: any) {
        console.error('[USERS] findAllAndCount fallback failed:', err2?.message || err2);
        const all = await this.usersService.findAll();
        res.set('Access-Control-Expose-Headers', 'Content-Range');
        res.set('Content-Range', `users 0-${all.length}/${all.length}`);
        return res.json(all);
      }
    }
  }

  // Admin: Delete user (with cascade cleanup)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    try {
      await this.usersService.safeRemove(id);
      return { id };
    } catch (err: any) {
      console.error('[USERS] safeRemove failed:', err?.code, err?.message, err?.detail);
      throw new BadRequestException(
        `Failed to delete user: ${err?.detail || err?.message || 'unknown error'}`,
      );
    }
  }
}
