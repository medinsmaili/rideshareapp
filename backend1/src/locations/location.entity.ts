import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';

@Entity('location_cities') // Ensure this name is 'location_cities'
export class City {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column() 
  country: string; 

  // REMOVE 'country_code' if you see it here!

  @OneToMany(() => MeetingPoint, (point) => point.city)
  meeting_points: MeetingPoint[];
}

@Entity('location_meeting_points')
export class MeetingPoint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @ManyToOne(() => City, (city) => city.meeting_points)
  @JoinColumn({ name: 'city_id' })
  city: City;
}