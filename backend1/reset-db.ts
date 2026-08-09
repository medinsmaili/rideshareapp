// backend/reset-db.ts
import { DataSource } from 'typeorm';
import { User } from './src/users/user.entity';
import { Ride } from './src/rides/ride.entity';
import { City, MeetingPoint } from './src/locations/location.entity';
import { Booking } from './src/bookings/booking.entity';
import { Vehicle } from './src/vehicles/vehicle.entity';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'nisu_admin', // Your DB username
  password: 'password123', // Your DB password
  database: 'nisu_db',     // Your DB name
  entities: [User, Ride, City, MeetingPoint, Booking, Vehicle],
  synchronize: true,       // This creates the tables automatically
  dropSchema: true,        // This WIPES the database on connection!
});

async function reset() {
  console.log('🔥 connecting to database...');
  await AppDataSource.initialize();
  console.log('💥 Database wiped and tables recreated!');

  console.log('🌱 Seeding cities...');
  const cityRepo = AppDataSource.getRepository(City);
  const pointRepo = AppDataSource.getRepository(MeetingPoint);

  // 1. Create Cities
  const tirana = cityRepo.create({ name: 'Tirana', country: 'Albania' });
  const pristina = cityRepo.create({ name: 'Pristina', country: 'Kosovo' });
  const durres = cityRepo.create({ name: 'Durrës', country: 'Albania' });
  const skopje = cityRepo.create({ name: 'Skopje', country: 'North Macedonia' });

  await cityRepo.save([tirana, pristina, durres, skopje]);

  // 2. Create Meeting Points (Optional)
  const teg = pointRepo.create({ name: 'TEG Mall', city: tirana });
  const grand = pointRepo.create({ name: 'Grand Hotel', city: pristina });

  await pointRepo.save([teg, grand]);

  console.log('✅ Cities added successfully.');
  await AppDataSource.destroy();
  console.log('🏁 Done. You can restart the server now.');
}

reset().catch((err) => console.error(err));