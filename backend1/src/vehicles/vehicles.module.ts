import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehiclesService } from './vehicles.service';
import { VehiclesController } from './vehicles.controller';
import { Vehicle } from './vehicle.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    // 1. THIS LINE IS CRITICAL. It creates the Repository.
    TypeOrmModule.forFeature([Vehicle]), 
    AuthModule,
  ],
  controllers: [VehiclesController],
  providers: [VehiclesService],
})
export class VehiclesModule {}