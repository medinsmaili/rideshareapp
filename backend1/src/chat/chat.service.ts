import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './message.entity';
import { Ride } from '../rides/ride.entity'; 
import { User } from '../users/user.entity';
import { NotificationsService } from '../notifications/notifications.service'; 

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message)
    private msgRepo: Repository<Message>,
    @InjectRepository(Ride)
    private rideRepo: Repository<Ride>, 
    private notificationsService: NotificationsService, 
  ) {}

  async getMessagesForRide(rideId: string): Promise<Message[]> {
    return this.msgRepo.find({
      where: { ride_id: rideId },
      relations: ['sender'],
      order: { created_at: 'ASC' },
    });
  }

  async saveMessage(rideId: string, content: string, sender: User): Promise<Message> {
    // 1. Save the Message
    const msg = this.msgRepo.create({
      ride_id: rideId,
      content,
      sender,
    });
    const savedMsg = await this.msgRepo.save(msg);

    // 2. Send Push Notification (Fire & Forget)
    this.notifyParticipants(rideId, content, sender);

    return savedMsg;
  }

  private async notifyParticipants(rideId: string, content: string, sender: User) {
    // Fetch Ride, Driver, and Passengers
    const ride = await this.rideRepo.findOne({
      where: { id: rideId },
      relations: ['driver', 'bookings', 'bookings.passenger'],
    });

    if (!ride) return;

    const recipientIds: string[] = [];

    // 1. Add Driver (if they are not the person sending the message)
    if (ride.driver && ride.driver.id !== sender.id) {
      recipientIds.push(String(ride.driver.id));
    }

    // 2. Add all Passengers (if they are not the person sending the message)
    if (ride.bookings) {
      for (const booking of ride.bookings) {
        const passenger = booking.passenger;
        if (passenger && passenger.id !== sender.id) {
          recipientIds.push(String(passenger.id));
        }
      }
    }

    // Ensure no duplicate notifications are sent to the same user
    const uniqueRecipients = [...new Set(recipientIds)];

    // 3. Send Notification to all other participants
    if (uniqueRecipients.length > 0) {
      await this.notificationsService.sendTemplated(
        uniqueRecipients,
        'chat_message',
        {
          heading: 'New message from {{sender}}',
          content: '{{content}}',
        },
        {
          sender: sender.first_name || 'A user',
          content: content || '',
        },
        { type: 'chat', rideId: rideId }
      );
    }
  }
}