import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Res } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import type { Response } from 'express';

@Controller('locations')
export class LocationsController {
  constructor(private locationsService: LocationsService) {}

  @Get('cities')
  async getAllCities() {
    return this.locationsService.getCities();
  }

  @Get('cities/:id')
  async getCity(@Param('id') id: string) {
    return this.locationsService.getCity(id);
  }

  @Get('cities/:id/meeting-points')
  async getMeetingPointsByCity(@Param('id') id: string) {
    return this.locationsService.getMeetingPoints(id);
  }

  @Post('cities')
  @UseGuards(AuthGuard('jwt'))
  async createCity(@Body() body: any) {
    return this.locationsService.createCity(body);
  }

  @Delete('cities/:id')
  @UseGuards(AuthGuard('jwt'))
  async deleteCity(@Param('id') id: string) {
    return this.locationsService.deleteCity(id);
  }
}

// Standalone controller for admin panel CRUD at /cities
@Controller('cities')
export class CitiesController {
  constructor(private locationsService: LocationsService) {}

  @Get()
  async list(@Res() res: Response) {
    const cities = await this.locationsService.getCities();
    const total = cities.length;
    res.set('Access-Control-Expose-Headers', 'Content-Range');
    res.set('Content-Range', `cities 0-${total}/${total}`);
    return res.json(cities);
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.locationsService.getCity(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  async create(@Body() body: any) {
    return this.locationsService.createCity(body);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.locationsService.updateCity(id, body);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  async remove(@Param('id') id: string) {
    await this.locationsService.deleteCity(id);
    return { status: 'success' };
  }
}

// Standalone controller for admin panel CRUD at /meeting-points
@Controller('meeting-points')
export class MeetingPointsController {
  constructor(private locationsService: LocationsService) {}

  @Get()
  async list(@Res() res: Response) {
    const points = await this.locationsService.getAllMeetingPoints();
    const total = points.length;
    res.set('Access-Control-Expose-Headers', 'Content-Range');
    res.set('Content-Range', `meeting-points 0-${total}/${total}`);
    return res.json(points);
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.locationsService.getMeetingPoint(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  async create(@Body() body: any) {
    return this.locationsService.createMeetingPoint(body);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.locationsService.updateMeetingPoint(id, body);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  async remove(@Param('id') id: string) {
    await this.locationsService.deleteMeetingPoint(id);
    return { status: 'success' };
  }
}