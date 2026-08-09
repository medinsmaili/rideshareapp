import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatGateway } from './chat.gateway';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { Message } from './message.entity';
import { Ride } from '../rides/ride.entity'; // <--- Import Ride Entity
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module'; // <--- Import Notifications
import { UsersModule } from '../users/users.module'; // <--- Import Users

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, Ride]), // <--- Add Ride here
    AuthModule,
    NotificationsModule, // <--- Add this
    UsersModule,         // <--- Add this
  ],
  controllers: [ChatController],
  providers: [ChatGateway, ChatService],
  exports: [ChatGateway]
})
export class ChatModule {}