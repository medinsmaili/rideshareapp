import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Ride } from '../rides/ride.entity';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ✅ ADDED CASCADE DELETION
  @ManyToOne(() => Ride, ride => ride.bookings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ride_id' })
  ride: Ride;

  // ✅ ADDED CASCADE DELETION
  @ManyToOne(() => User, user => user.bookings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'passenger_id' })
  passenger: User;

  @Column('int', { default: 1 })
  seats_booked: number;

  @Column({ default: 'confirmed' }) // confirmed, cancelled
  status: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}