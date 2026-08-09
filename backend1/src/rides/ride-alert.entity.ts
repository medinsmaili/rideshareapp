import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { City } from '../locations/location.entity';

@Entity('ride_alerts')
export class RideAlert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid', nullable: true })
  origin_city_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  destination_city_id: string | null;

  @ManyToOne(() => City, { nullable: true })
  @JoinColumn({ name: 'origin_city_id' })
  origin_city: City;

  @ManyToOne(() => City, { nullable: true })
  @JoinColumn({ name: 'destination_city_id' })
  destination_city: City;

  @Column({ type: 'date' })
  target_date: string;

  @CreateDateColumn()
  created_at: Date;
}