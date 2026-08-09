import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { Booking } from './booking.entity';
import { Ride } from '../rides/ride.entity';
import { AuthModule } from '../auth/auth.module'; 
// FIX: Import NotificationsModule
import { NotificationsModule } from '../notifications/notifications.module'; 

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, Ride]),
    AuthModule,
    NotificationsModule, // <--- Add this line
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
})
export class BookingsModule {}