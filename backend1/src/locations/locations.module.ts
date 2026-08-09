import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationsController, MeetingPointsController, CitiesController } from './locations.controller';
import { LocationsService } from './locations.service';
import { City, MeetingPoint } from './location.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([City, MeetingPoint]),
  ],
  controllers: [LocationsController, MeetingPointsController, CitiesController],
  providers: [LocationsService],
})
export class LocationsModule {}