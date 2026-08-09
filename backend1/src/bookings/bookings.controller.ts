import { Controller, Post, Get, Delete, Param, Body, UseGuards, Request, Query, Res, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BookingsService } from './bookings.service';
import type { Response } from 'express'; 

@Controller('bookings')
export class BookingsController {
  constructor(private bookingsService: BookingsService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async getAllBookings(@Request() req, @Query() query: any, @Res() res: Response) {
    if (req.user.role !== 'admin') throw new BadRequestException('Admin only');
    
    // ✅ PAGINATION LOGIC
    const take = query._end ? parseInt(query._end) - (query._start ? parseInt(query._start) : 0) : 25;
    const skip = query._start ? parseInt(query._start) : 0;
    const order = query._sort ? { [query._sort]: query._order || 'DESC' } : { created_at: 'DESC' };

    const [data, total] = await this.bookingsService.findAllAndCount(skip, take, order);
    
    res.set('Access-Control-Expose-Headers', 'Content-Range');
    res.set('Content-Range', `bookings ${skip}-${skip + data.length}/${total}`);
    return res.json(data);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async createBooking(@Body('ride_id') rideId: string, @Body('seats') seats: number, @Request() req) {
    return this.bookingsService.createBooking(rideId, req.user, seats);
  }

  @Get('my-bookings')
  @UseGuards(AuthGuard('jwt'))
  getMyBookings(@Request() req) {
    return this.bookingsService.getMyBookings(req.user);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  cancelBooking(@Param('id') id: string, @Request() req) {
    return this.bookingsService.cancelBooking(id, req.user);
  }
}