import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm'; 
import { Ride } from './ride.entity';
import { RideAlert } from './ride-alert.entity'; 
import { CreateRideDto } from './dto/create-ride.dto';
import { User } from '../users/user.entity';
import { NotificationsService } from '../notifications/notifications.service'; 

@Injectable()
export class RidesService {
  constructor(
    @InjectRepository(Ride)
    private ridesRepo: Repository<Ride>,
    @InjectRepository(RideAlert)
    private rideAlertsRepo: Repository<RideAlert>,
    private notificationsService: NotificationsService 
  ) {}

  // ✅ FIX: Using 'new RideAlert()' bypasses the TypeORM DeepPartial overload error
  async createRideAlert(user: User, originId: string, destId: string, date: string) {
    const alert = new RideAlert();
    alert.user = user;
    alert.origin_city_id = originId || null;
    alert.destination_city_id = destId || null;
    alert.target_date = date || new Date().toISOString().split('T')[0];

    await this.rideAlertsRepo.save(alert);
    return { status: 'success', message: 'Alert created' };
  }

  async createRide(createRideDto: CreateRideDto, user: User): Promise<Ride> {
     const ride = this.ridesRepo.create({
         driver: user,
         departure_time: new Date(createRideDto.departure_time),
         price_per_seat: createRideDto.price_per_seat,
         total_seats: createRideDto.available_seats,
         origin_city: { id: createRideDto.origin_city_id },
         destination_city: { id: createRideDto.destination_city_id },
         origin_meeting_point: createRideDto.origin_meeting_point_id ? { id: createRideDto.origin_meeting_point_id } : undefined,
         destination_meeting_point: createRideDto.destination_meeting_point_id ? { id: createRideDto.destination_meeting_point_id } : undefined,
         vehicle: createRideDto.vehicle_id ? { id: createRideDto.vehicle_id } : undefined, 
         status: 'active',
         is_student_pricing: createRideDto.is_student_pricing || false,
         student_price_per_seat: createRideDto.student_price_per_seat || null,
         female_only: createRideDto.female_only || false 
     });
     
     const savedRide = await this.ridesRepo.save(ride);
     
     // ✅ NEW: Trigger the alert check silently in the background
     this.checkAndTriggerAlerts(savedRide).catch(e => console.error('Alert processing error:', e));

     return savedRide;
  }

  // ✅ NEW: Finds matching users and fires OneSignal notification
  private async checkAndTriggerAlerts(ride: Ride) {
    const rideDate = new Date(ride.departure_time).toISOString().split('T')[0];
    
    const qb = this.rideAlertsRepo.createQueryBuilder('alert')
      .leftJoinAndSelect('alert.user', 'user')
      .where('alert.target_date = :rideDate', { rideDate })
      .andWhere('(alert.origin_city_id = :originId OR alert.origin_city_id IS NULL)', { originId: ride.origin_city.id })
      .andWhere('(alert.destination_city_id = :destId OR alert.destination_city_id IS NULL)', { destId: ride.destination_city.id })
      .andWhere('user.id != :driverId', { driverId: ride.driver.id }); 

    const matchingAlerts = await qb.getMany();

    if (matchingAlerts.length > 0) {
      const userIds = matchingAlerts.map(a => a.user.id);
      const fullRide = await this.ridesRepo.findOne({ where: {id: ride.id}, relations: ['origin_city', 'destination_city']});
      
      await this.notificationsService.sendTemplated(
        userIds,
        'new_ride_alert',
        {
          heading: '🚗 New Ride Match!',
          content: 'A new ride from {{origin}} to {{destination}} was just posted for {{date}}. Book it before seats run out!',
        },
        {
          origin: fullRide?.origin_city?.name || 'your origin',
          destination: fullRide?.destination_city?.name || 'your destination',
          date: rideDate,
        },
        { type: 'new_ride_alert', rideId: ride.id }
      );
    }
  }

  async getUserAlerts(user: User): Promise<RideAlert[]> {
    return this.rideAlertsRepo.find({
      where: { user: { id: user.id } },
      relations: ['origin_city', 'destination_city'],
      order: { created_at: 'DESC' },
    });
  }

  async deleteUserAlert(alertId: string, user: User): Promise<{ status: string }> {
    const alert = await this.rideAlertsRepo.findOne({
      where: { id: alertId, user: { id: user.id } },
    });
    if (!alert) throw new NotFoundException('Alert not found');
    await this.rideAlertsRepo.delete(alertId);
    return { status: 'success' };
  }

  async getRidesForDriver(user: User): Promise<Ride[]> {
    return this.ridesRepo.find({
      where: { driver: { id: user.id } },
      relations: ['origin_city', 'destination_city', 'vehicle'],
      order: { departure_time: 'DESC' },
    });
  }

  async searchRides(originId: string, destId: string, date: string, currentUser?: User): Promise<Ride[]> {
    const query = this.ridesRepo.createQueryBuilder('ride')
      .leftJoinAndSelect('ride.driver', 'driver')
      .leftJoinAndSelect('ride.origin_city', 'origin_city')
      .leftJoinAndSelect('ride.destination_city', 'destination_city')
      .leftJoinAndSelect('ride.vehicle', 'vehicle')
      .leftJoinAndSelect('ride.origin_meeting_point', 'origin_meeting_point')
      .leftJoinAndSelect('ride.destination_meeting_point', 'destination_meeting_point')
      .leftJoinAndSelect('ride.bookings', 'bookings')
      .where('ride.status = :status', { status: 'active' });

    if (date) {
      const searchDate = new Date(date);
      searchDate.setHours(0, 0, 0, 0); 
      query.andWhere('ride.departure_time >= :date', { date: searchDate });
    }

    if (originId) {
      query.andWhere('origin_city.id = :originId', { originId });
    }

    if (destId) {
      query.andWhere('destination_city.id = :destId', { destId });
    }

    if (currentUser) {
      const blockedUsers = Array.isArray(currentUser.blocked_users) ? currentUser.blocked_users : [];
      if (blockedUsers.length > 0) {
        query.andWhere('driver.id NOT IN (:...blockedUsers)', { blockedUsers });
      }

      if (currentUser.gender === 'M') {
        query.andWhere('ride.female_only = :isFemaleOnly', { isFemaleOnly: false });
      }
    }

    query.orderBy('ride.departure_time', 'ASC');

    return await query.getMany();
  }

  async getRecentRides(currentUser?: User): Promise<Ride[]> {
    const query = this.ridesRepo.createQueryBuilder('ride')
      .leftJoinAndSelect('ride.driver', 'driver')
      .leftJoinAndSelect('ride.origin_city', 'origin_city')
      .leftJoinAndSelect('ride.destination_city', 'destination_city')
      .leftJoinAndSelect('ride.vehicle', 'vehicle')
      .leftJoinAndSelect('ride.origin_meeting_point', 'origin_meeting_point')
      .leftJoinAndSelect('ride.destination_meeting_point', 'destination_meeting_point')
      .leftJoinAndSelect('ride.bookings', 'bookings')
      .where('ride.departure_time >= :now', { now: new Date() })
      .andWhere('ride.status = :status', { status: 'active' });

    if (currentUser) {
      const blockedUsers = Array.isArray(currentUser.blocked_users) ? currentUser.blocked_users : [];
      if (blockedUsers.length > 0) {
        query.andWhere('driver.id NOT IN (:...blockedUsers)', { blockedUsers });
      }

      if (currentUser.gender === 'M') {
        query.andWhere('ride.female_only = :isFemaleOnly', { isFemaleOnly: false });
      }
    }

    query.orderBy('ride.departure_time', 'ASC').take(20);

    return await query.getMany();
  }

  async findAllAndCount(): Promise<[Ride[], number]> {
    return this.ridesRepo.findAndCount({
      relations: ['driver', 'origin_city', 'destination_city', 'vehicle'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Ride> {
    const ride = await this.ridesRepo.findOne({
      where: { id },
      relations: [
        'driver', 
        'vehicle', 
        'origin_city', 
        'destination_city', 
        'bookings',            
        'bookings.passenger'    
      ],
    });
    if (!ride) throw new NotFoundException('Ride not found');
    return ride;
  }

  // Reserve/unreserve a spot (blocks a seat without changing capacity)
  async reserveSpot(rideId: string, userId: string): Promise<void> {
    const ride = await this.ridesRepo.findOne({ where: { id: rideId }, relations: ['driver'] });
    if (!ride) throw new NotFoundException('Ride not found');
    if (ride.driver.id !== userId) throw new UnauthorizedException('You do not own this ride');

    const available = ride.total_seats - (ride.seats_taken || 0) - (ride.reserved_spots || 0);
    if (available <= 0) throw new BadRequestException('No available seats to reserve');

    ride.reserved_spots = (ride.reserved_spots || 0) + 1;
    await this.ridesRepo.save(ride);
  }

  async unreserveSpot(rideId: string, userId: string): Promise<void> {
    const ride = await this.ridesRepo.findOne({ where: { id: rideId }, relations: ['driver'] });
    if (!ride) throw new NotFoundException('Ride not found');
    if (ride.driver.id !== userId) throw new UnauthorizedException('You do not own this ride');

    if ((ride.reserved_spots || 0) <= 0) throw new BadRequestException('No reserved spots to release');

    ride.reserved_spots = ride.reserved_spots - 1;
    await this.ridesRepo.save(ride);
  }

  async completeRide(rideId: string, userId: string): Promise<void> {
    const ride = await this.ridesRepo.findOne({
      where: { id: rideId },
      relations: ['driver']
    });

    if (!ride) throw new NotFoundException('Ride not found');
    if (ride.driver.id !== userId) throw new UnauthorizedException('You do not own this ride');

    ride.status = 'completed';
    await this.ridesRepo.save(ride);
  }

  async cancelRide(rideId: string, userId: string, reason: string): Promise<void> {
    const ride = await this.ridesRepo.findOne({
      where: { id: rideId },
      relations: ['driver', 'bookings', 'bookings.passenger', 'destination_city']
    });

    if (!ride) throw new NotFoundException('Ride not found');
    
    if (ride.driver.id !== userId) {
      throw new UnauthorizedException('You do not own this ride');
    }

    ride.status = 'cancelled';
    ride.cancellation_reason = reason;
    await this.ridesRepo.save(ride);

    const targetExternalIds = ride.bookings
      .map(b => b.passenger?.id) 
      .filter(id => !!id) as string[];

    if (targetExternalIds.length > 0) {
      await this.notificationsService.sendTemplated(
        targetExternalIds,
        'ride_cancelled',
        {
          heading: 'Ride Cancelled ⚠️',
          content: 'The ride to {{destination}} was cancelled. Reason: {{reason}}',
        },
        {
          destination: ride.destination_city?.name || 'destination',
          reason: reason || '',
        },
        { type: 'ride_cancelled', rideId }
      );
    }
  }

  async remove(id: string): Promise<void> {
    const mgr = this.ridesRepo.manager;
    // Clean up dependents that don't have CASCADE
    await mgr.query(`DELETE FROM messages WHERE ride_id = $1`, [id]);
    await mgr.query(`DELETE FROM bookings WHERE ride_id = $1`, [id]);
    await this.ridesRepo.delete(id);
  }
}