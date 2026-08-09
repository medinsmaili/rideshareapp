import { DataSource } from 'typeorm';
import { City, MeetingPoint } from './locations/location.entity';
import { User } from './users/user.entity';
import { Ride } from './rides/ride.entity';
import { Booking } from './bookings/booking.entity';
import { Vehicle } from './vehicles/vehicle.entity';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'nisu_admin',
  password: 'password123',
  database: 'nisu_db',
  entities: [User, Ride, City, MeetingPoint, Booking, Vehicle],
  synchronize: true,
});

async function seed() {
  console.log('🌱 Connecting to database...');
  await AppDataSource.initialize();

  const cityRepo = AppDataSource.getRepository(City);
  const pointRepo = AppDataSource.getRepository(MeetingPoint);

  console.log('🧹 Clearing old location data...');
  // FIX: Use TRUNCATE to wipe data properly. 
  // 'CASCADE' ensures Meeting Points are deleted when Cities are deleted.
  await AppDataSource.query('TRUNCATE TABLE location_meeting_points, location_cities CASCADE');

  console.log('🏙️ Inserting Cities...');
  const tirana = cityRepo.create({ name: 'Tirana', country: 'Albania' });
  const pristina = cityRepo.create({ name: 'Pristina', country: 'Kosovo' });
  const durres = cityRepo.create({ name: 'Durrës', country: 'Albania' });
  const skopje = cityRepo.create({ name: 'Skopje', country: 'North Macedonia' });

  await cityRepo.save([tirana, pristina, durres, skopje]);

  console.log('📍 Inserting Meeting Points...');
  const teg = pointRepo.create({ name: 'TEG Mall', city: tirana });
  const grand = pointRepo.create({ name: 'Grand Hotel', city: pristina });

  await pointRepo.save([teg, grand]);

  console.log('✅ Seed complete! Database is clean and ready.');
  await AppDataSource.destroy();
}

seed().catch((err) => console.error(err));