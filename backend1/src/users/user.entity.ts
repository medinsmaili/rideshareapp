import { Entity, Column, PrimaryGeneratedColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Ride } from '../rides/ride.entity';
import { Booking } from '../bookings/booking.entity';
import { Report } from '../reports/report.entity';
import { Vehicle } from '../vehicles/vehicle.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password_hash: string;

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column({ nullable: true })
  phone_number: string;

  @Column({ nullable: true })
  profile_picture: string;

  // ✅ NEW: Gender selection ('M', 'F', or null)
  @Column({ nullable: true, type: 'varchar', length: 1 })
  gender: string;

  // ✅ NEW: Ratings System
  @Column('decimal', { precision: 3, scale: 2, default: 0 })
  average_rating: number;

  @Column('int', { default: 0 })
  rating_count: number;

  // ✅ NEW: Blocked Users Array (Stores UUIDs of blocked users)
  @Column('simple-array', { nullable: true, default: '' })
  blocked_users: string[];

  // --- Verification Statuses ---
  @Column({ default: 'none' }) 
  driver_verification_status: string;

  @Column({ default: 'none' }) 
  student_verification_status: string;

  @Column({ default: false })
  is_verified_driver: boolean;

  @Column({ default: false })
  is_student_verified: boolean;

  @Column({ nullable: true })
  verification_docs_url: string;

  @Column({ nullable: true })
  student_id_url: string;

  // --- Email Verification ---
  @Column({ default: false })
  is_email_verified: boolean;

  @Column({ type: 'varchar', nullable: true }) 
  email_verification_code: string | null;

  @Column({ default: false })
  is_banned: boolean;

  @Column({ type: 'text', nullable: true })
  ban_reason: string | null;

  @Column({ type: 'timestamp', nullable: true })
  ban_expires_at: Date | null;

  @Column({ nullable: true })
  onesignal_id: string;

  @Column({ default: 'user' })
  role: string; 

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Ride, (ride) => ride.driver)
  rides_as_driver: Ride[];

  @OneToMany(() => Booking, (booking) => booking.passenger)
  bookings: Booking[];

  @OneToMany(() => Report, (report) => report.reporter)
  reports_filed: Report[];

  @OneToMany(() => Report, (report) => report.reported_user)
  reports_received: Report[];

  @OneToMany(() => Vehicle, (vehicle) => vehicle.owner)
  vehicles: Vehicle[];
}