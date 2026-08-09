import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway'; 

// IMPORTANT: This matches the route your React Native app is calling
@Controller('rides/:id/messages') 
@UseGuards(AuthGuard())
export class ChatController {
  constructor(
    private chatService: ChatService,
    private chatGateway: ChatGateway, 
  ) {}

  @Get()
  async getMessages(@Param('id') rideId: string) {
    return this.chatService.getMessagesForRide(rideId);
  }

  @Post()
  async sendMessage(
    @Param('id') rideId: string,
    @Body('content') content: string,
    @Request() req
  ) {
    // 1. Save via Service
    const newMessage = await this.chatService.saveMessage(rideId, content, req.user);
    
    // 2. Emit to WebSocket Room so live users see it
    this.chatGateway.server.to(`ride_${rideId}`).emit('newMessage', newMessage);

    return newMessage;
  }
}