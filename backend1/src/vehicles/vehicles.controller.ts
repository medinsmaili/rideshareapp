import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('vehicles')
@UseGuards(AuthGuard('jwt'))
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  create(@Body() createVehicleDto: CreateVehicleDto, @Request() req) {
    return this.vehiclesService.create(createVehicleDto, req.user);
  }

  @Get()
  findAll(@Request() req) {
    // Admin sees all vehicles; regular users see only their own
    if (req.user.role === 'admin') {
      return this.vehiclesService.findAll();
    }
    return this.vehiclesService.findAllForUser(req.user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    // Admin can delete any vehicle
    if (req.user.role === 'admin') {
      return this.vehiclesService.removeById(id);
    }
    return this.vehiclesService.remove(id, req.user);
  }
}
