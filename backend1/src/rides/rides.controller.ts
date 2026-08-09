import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
  Res,
  Delete,
  ForbiddenException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { RidesService } from './rides.service';
import { CreateRideDto } from './dto/create-ride.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('rides')
export class RidesController {
  constructor(private ridesService: RidesService) {}

  @Get('search')
  @UseGuards(AuthGuard('jwt'))
  searchRides(
    @Query('origin_city_id') originId: string,
    @Query('destination_city_id') destId: string,
    @Query('date') date: string,
  ) {
    if (!originId && !destId) {
      return this.ridesService.getRecentRides();
    }
    const searchDate = date || new Date().toISOString();
    return this.ridesService.searchRides(originId, destId, searchDate);
  }

  @Get('my-rides')
  @UseGuards(AuthGuard('jwt'))
  getMyRides(@Request() req) {
    return this.ridesService.getRidesForDriver(req.user);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  async findAll(@Res() res: Response) {
    const [result, total] = await this.ridesService.findAllAndCount();
    res.set('Access-Control-Expose-Headers', 'Content-Range');
    res.set('Content-Range', `rides 0-${total}/${total}`);
    return res.json(result);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  createRide(@Body() createRideDto: CreateRideDto, @Request() req) {
    return this.ridesService.createRide(createRideDto, req.user);
  }

  // Push Notification Alert Management
  @Post('alerts')
  @UseGuards(AuthGuard('jwt'))
  async createAlert(@Body() body: any, @Request() req) {
    return this.ridesService.createRideAlert(
      req.user,
      body.origin_city_id,
      body.destination_city_id,
      body.target_date
    );
  }

  @Get('alerts/my')
  @UseGuards(AuthGuard('jwt'))
  async getMyAlerts(@Request() req) {
    return this.ridesService.getUserAlerts(req.user);
  }

  @Delete('alerts/:alertId')
  @UseGuards(AuthGuard('jwt'))
  async deleteAlert(@Param('alertId', ParseUUIDPipe) alertId: string, @Request() req) {
    return this.ridesService.deleteUserAlert(alertId, req.user);
  }

  // Driver reserve/unreserve a spot (blocks seat without changing capacity)
  @Put(':id/reserve-spot')
  @UseGuards(AuthGuard('jwt'))
  async reserveSpot(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    await this.ridesService.reserveSpot(id, req.user.id);
    return { status: 'success', message: 'Spot reserved' };
  }

  @Put(':id/unreserve-spot')
  @UseGuards(AuthGuard('jwt'))
  async unreserveSpot(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    await this.ridesService.unreserveSpot(id, req.user.id);
    return { status: 'success', message: 'Spot released' };
  }

  @Put(':id/cancel')
  @UseGuards(AuthGuard('jwt'))
  async cancelRide(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
    @Request() req,
  ) {
    await this.ridesService.cancelRide(id, req.user.id, reason);
    return { status: 'success', message: 'Ride cancelled' };
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  async updateRideStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: string,
    @Request() req,
  ) {
    if (status === 'completed') {
      await this.ridesService.completeRide(id, req.user.id);
      return { status: 'success', message: 'Ride completed' };
    }
    return { status: 'ignored', message: 'No valid update provided' };
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.ridesService.findOne(id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async remove(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    const ride = await this.ridesService.findOne(id);
    if (ride.driver?.id !== req.user.id && req.user.role !== 'admin') {
      throw new ForbiddenException('You can only delete your own rides');
    }
    return this.ridesService.remove(id);
  }
}