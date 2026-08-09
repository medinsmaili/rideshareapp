import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static'; 
import { join } from 'path'; 

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RidesModule } from './rides/rides.module';
import { LocationsModule } from './locations/locations.module';
import { BookingsModule } from './bookings/bookings.module';
import { VehiclesModule } from './vehicles/vehicles.module'; 
import { ChatModule } from './chat/chat.module';
import { ReportsModule } from './reports/reports.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MailModule } from './mail/mail.module';
import { LanguagesModule } from './languages/languages.module';
import { TranslationsModule } from './translations/translations.module';
import { SettingsModule } from './settings/settings.module';
import { AdminModule } from './admin/admin.module';

import { User } from './users/user.entity';
import { Ride } from './rides/ride.entity';
import { RideAlert } from './rides/ride-alert.entity';
import { City, MeetingPoint } from './locations/location.entity';
import { Booking } from './bookings/booking.entity';
import { Vehicle } from './vehicles/vehicle.entity'; 
import { Message } from './chat/message.entity';
import { Report } from './reports/report.entity';
import { Language } from './languages/language.entity';
import { Translation } from './translations/translation.entity';
import { Setting } from './settings/setting.entity'; 

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'), 
      serveRoot: '/uploads', 
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'postgres',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'nisu_admin',
      password: process.env.DB_PASSWORD, 
      database: process.env.DB_DATABASE || 'nisu_db',
      entities: [User, Ride, RideAlert, City, MeetingPoint, Booking, Vehicle, Message, Report, Language, Translation, Setting],
      // ✅ FIX: Only synchronize in non-production environments to protect data
      synchronize: process.env.NODE_ENV !== 'production', 
    }),
    AuthModule,
    UsersModule,
    RidesModule,
    LocationsModule,
    BookingsModule,
    VehiclesModule,
    ChatModule, 
    ReportsModule, 
    NotificationsModule,
    MailModule,
    LanguagesModule,
    TranslationsModule,
    SettingsModule,
    AdminModule,
  ],
  providers: [], 
  controllers: [], 
})
export class AppModule {}