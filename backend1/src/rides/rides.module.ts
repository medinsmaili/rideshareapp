import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RidesService } from './rides.service';
import { RidesController } from './rides.controller';
import { Ride } from './ride.entity';
import { RideAlert } from './ride-alert.entity'; 
import { AuthModule } from '../auth/auth.module';
import { City, MeetingPoint } from '../locations/location.entity';
import { NotificationsModule } from '../notifications/notifications.module'; 

@Module({
  imports: [
    TypeOrmModule.forFeature([Ride, RideAlert, City, MeetingPoint]), 
    AuthModule,
    NotificationsModule
  ],
  controllers: [RidesController],
  providers: [RidesService],
})
export class RidesModule {}