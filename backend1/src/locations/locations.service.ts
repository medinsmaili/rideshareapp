import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { City, MeetingPoint } from './location.entity';

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(City)
    private cityRepo: Repository<City>,
    @InjectRepository(MeetingPoint)
    private pointRepo: Repository<MeetingPoint>,
  ) {}

  async getCities(): Promise<City[]> {
    return this.cityRepo.find({ relations: ['meeting_points'], order: { name: 'ASC' } });
  }

  async getCity(id: string): Promise<City> {
    const city = await this.cityRepo.findOneBy({ id });
    if (!city) throw new NotFoundException('City not found');
    return city;
  }

  async getAllMeetingPoints(): Promise<MeetingPoint[]> {
    return this.pointRepo.find({ relations: ['city'], order: { name: 'ASC' } });
  }

  async getMeetingPoint(id: string): Promise<MeetingPoint> {
    const point = await this.pointRepo.findOne({ where: { id }, relations: ['city'] });
    if (!point) throw new NotFoundException('Meeting point not found');
    return point;
  }

  async createCity(data: Partial<City>): Promise<City> {
    const city = this.cityRepo.create(data);
    return this.cityRepo.save(city);
  }

  async updateCity(id: string, data: Partial<City>): Promise<City> {
    const city = await this.getCity(id);
    Object.assign(city, data);
    return this.cityRepo.save(city);
  }

  async createMeetingPoint(data: any): Promise<MeetingPoint> {
    const point = this.pointRepo.create({
      name: data.name,
      address: data.address || null,
      city: { id: data.city_id } as any,
    });
    return this.pointRepo.save(point);
  }

  async updateMeetingPoint(id: string, data: any): Promise<MeetingPoint> {
    const point = await this.getMeetingPoint(id);
    if (data.name !== undefined) point.name = data.name;
    if (data.address !== undefined) point.address = data.address;
    if (data.city_id) point.city = { id: data.city_id } as any;
    return this.pointRepo.save(point);
  }

  async deleteCity(id: string): Promise<void> {
    const mgr = this.cityRepo.manager;
    // Block delete if rides reference the city
    const rideCount = await mgr.query(
      `SELECT COUNT(*)::int AS c FROM rides WHERE origin_city_id = $1 OR destination_city_id = $1`,
      [id],
    );
    if (rideCount[0]?.c > 0) {
      throw new Error(`Cannot delete city: ${rideCount[0].c} ride(s) reference it.`);
    }
    await mgr.query(`DELETE FROM ride_alerts WHERE origin_city_id = $1 OR destination_city_id = $1`, [id]);
    await mgr.query(`DELETE FROM location_meeting_points WHERE city_id = $1`, [id]);
    await this.cityRepo.delete(id);
  }

  async deleteMeetingPoint(id: string): Promise<void> {
    const mgr = this.pointRepo.manager;
    // Null out FK on rides referencing this meeting point
    await mgr.query(`UPDATE rides SET origin_meeting_point_id = NULL WHERE origin_meeting_point_id = $1`, [id]);
    await mgr.query(`UPDATE rides SET destination_meeting_point_id = NULL WHERE destination_meeting_point_id = $1`, [id]);
    await this.pointRepo.delete(id);
  }

  async getMeetingPoints(cityId: string): Promise<MeetingPoint[]> {
    return this.pointRepo.find({ where: { city: { id: cityId } } });
  }
}