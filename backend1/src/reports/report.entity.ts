import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Ride } from '../rides/ride.entity';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  reason: string;

  @Column({ default: 'pending' }) // pending, reviewed, resolved
  status: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reporter_id' })
  reporter: User;

  @Column()
  reporter_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reported_user_id' })
  reported_user: User;

  @Column()
  reported_user_id: string;

  @ManyToOne(() => Ride, { nullable: true })
  @JoinColumn({ name: 'ride_id' })
  ride: Ride;

  @Column({ nullable: true })
  ride_id: string;
}