import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { City, MeetingPoint } from '../locations/location.entity';
import { Vehicle } from '../vehicles/vehicle.entity';
import { Booking } from '../bookings/booking.entity';

@Entity('rides')
export class Ride {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, user => user.rides_as_driver, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'driver_id' })
  driver: User;

  @ManyToOne(() => City)
  @JoinColumn({ name: 'origin_city_id' })
  origin_city: City;

  @ManyToOne(() => City)
  @JoinColumn({ name: 'destination_city_id' })
  destination_city: City;

  @ManyToOne(() => MeetingPoint, { nullable: true })
  @JoinColumn({ name: 'origin_meeting_point_id' })
  origin_meeting_point: MeetingPoint;

  @ManyToOne(() => MeetingPoint, { nullable: true })
  @JoinColumn({ name: 'destination_meeting_point_id' })
  destination_meeting_point: MeetingPoint;

  @ManyToOne(() => Vehicle, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: Vehicle;

  @Column()
  departure_time: Date;

  @Column('decimal', { precision: 10, scale: 2 })
  price_per_seat: number;

  @Column('int')
  total_seats: number;

  @Column('int', { default: 0 })
  seats_taken: number;

  @Column('int', { default: 0 })
  reserved_spots: number;

  @Column({ default: 'active' })
  status: string;

  @Column({ default: false })
  is_student_pricing: boolean;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  student_price_per_seat: number | null;

  @Column({ default: false })
  female_only: boolean;

  // FIXED: Added missing property required by RidesService line 143
  @Column({ type: 'text', nullable: true })
  cancellation_reason: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Booking, booking => booking.ride)
  bookings: Booking[];
}