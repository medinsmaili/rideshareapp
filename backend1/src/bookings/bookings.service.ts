import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from './booking.entity';
import { Ride } from '../rides/ride.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
    @InjectRepository(Ride)
    private ridesRepository: Repository<Ride>,
    private notificationsService: NotificationsService,
  ) {}

  async getMyBookings(user: any): Promise<Booking[]> {
    return this.bookingsRepository.find({
      where: { passenger: { id: user.id } },
      relations: ['ride', 'ride.origin_city', 'ride.destination_city', 'ride.driver'],
      order: { created_at: 'DESC' }
    });
  }

  async createBooking(rideId: string, passenger: any, seats: number): Promise<Booking> {
    const booking = this.bookingsRepository.create({
      ride: { id: rideId },
      passenger,
      seats_booked: seats,
    });
    
    const savedBooking = await this.bookingsRepository.save(booking);

    // --- NEW: Notify Driver of New Booking ---
    try {
      const ride = await this.ridesRepository.findOne({
        where: { id: rideId },
        relations: ['driver', 'origin_city', 'destination_city'],
      });
      
      if (ride && ride.driver && ride.driver.id !== passenger.id) {
        const originName = ride.origin_city?.name || 'Origin';
        const destName = ride.destination_city?.name || 'Destination';
        
        await this.notificationsService.sendTemplated(
          [String(ride.driver.id)],
          'booking_created',
          {
            heading: 'New Seat Booked! 💺',
            content: '{{passenger}} booked a seat on your ride from {{origin}} to {{destination}}.',
          },
          {
            passenger: passenger.first_name || 'A passenger',
            origin: originName,
            destination: destName,
          },
          { type: 'booking_created', rideId: ride.id }
        );
      }
    } catch (error) {
      console.error('Notification error on booking creation:', error);
    }

    return savedBooking;
  }

  async cancelBooking(id: string, user: any): Promise<void> {
    const booking = await this.bookingsRepository.findOne({
      where: { id, passenger: { id: user.id } },
      relations: ['ride', 'ride.driver', 'ride.origin_city', 'ride.destination_city'],
    });
    
    if (!booking) throw new NotFoundException('Booking not found');
    
    const ride = booking.ride;
    
    await this.bookingsRepository.delete(id);

    // --- NEW: Notify Driver of Cancellation ---
    try {
      if (ride && ride.driver && ride.driver.id !== user.id) {
        const destName = ride.destination_city?.name || 'their destination';
        
        await this.notificationsService.sendTemplated(
          [String(ride.driver.id)],
          'booking_cancelled',
          {
            heading: 'Seat Cancelled ⚠️',
            content: '{{passenger}} cancelled their seat on your ride to {{destination}}.',
          },
          {
            passenger: user.first_name || 'A passenger',
            destination: destName,
          },
          { type: 'booking_cancelled', rideId: ride.id }
        );
      }
    } catch (error) {
      console.error('Notification error on booking cancellation:', error);
    }
  }

  async findAllAndCount(skip: number, take: number, order: any): Promise<[Booking[], number]> {
    return this.bookingsRepository.findAndCount({ skip, take, order, relations: ['passenger', 'ride'] });
  }
}