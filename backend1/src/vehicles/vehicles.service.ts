import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from './vehicle.entity';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { User } from '../users/user.entity';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private vehiclesRepo: Repository<Vehicle>,
  ) {}

  async create(createVehicleDto: CreateVehicleDto, user: User): Promise<Vehicle> {
    const vehicle = this.vehiclesRepo.create({
      ...createVehicleDto,
      owner: user,
    });
    return this.vehiclesRepo.save(vehicle);
  }

  async findAllForUser(user: User): Promise<Vehicle[]> {
    return this.vehiclesRepo.find({
      where: { owner: { id: user.id } },
      order: { brand: 'ASC' },
    });
  }

  async findAll(): Promise<Vehicle[]> {
    return this.vehiclesRepo.find({
      relations: ['owner'],
      order: { brand: 'ASC' },
    });
  }

  async removeById(id: string): Promise<void> {
    const vehicle = await this.vehiclesRepo.findOne({ where: { id } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    // Null out FK on rides referencing this vehicle so delete doesn't fail
    await this.vehiclesRepo.manager.query(`UPDATE rides SET vehicle_id = NULL WHERE vehicle_id = $1`, [id]);
    await this.vehiclesRepo.remove(vehicle);
  }

  async remove(id: string, user: User): Promise<void> {
    const vehicle = await this.vehiclesRepo.findOne({
      where: { id },
      relations: ['owner'],
    });

    if (!vehicle) throw new NotFoundException('Vehicle not found');
    if (vehicle.owner.id !== user.id) {
      throw new UnauthorizedException('You do not own this vehicle');
    }

    await this.vehiclesRepo.remove(vehicle);
  }
}