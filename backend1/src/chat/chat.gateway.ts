import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service'; // <--- Use Service instead of Repo
import { UsersService } from '../users/users.service'; // <--- To find sender

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(
    private chatService: ChatService, // <--- Inject Service
    private usersService: UsersService, // <--- Inject Users Service
  ) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(@MessageBody() rideId: string, @ConnectedSocket() client: Socket) {
    if (!rideId || rideId === 'undefined') return;
    client.join(`ride_${rideId}`);
    console.log(`Client ${client.id} joined ride_${rideId}`);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(@MessageBody() payload: { rideId: string; senderId: string; content: string }) {
    // 1. Fetch full sender object (needed for name in notification)
    const sender = await this.usersService.findOne(payload.senderId);
    if (!sender) return;

    // 2. Save via Service (This now triggers Push Notification too!)
    const savedMsg = await this.chatService.saveMessage(payload.rideId, payload.content, sender);

    // 3. Broadcast to Socket Room (Real-time update)
    // We attach the sender relation manually or rely on what's returned
    // Usually save returns the object, we might need to re-attach sender for the UI
    savedMsg.sender = sender; 
    
    this.server.to(`ride_${payload.rideId}`).emit('newMessage', savedMsg);
  }

  @SubscribeMessage('getMessages')
  async handleGetMessages(@MessageBody('rideId') rideId: string, @ConnectedSocket() client: Socket) {
    const messages = await this.chatService.getMessagesForRide(rideId);
    client.emit('allMessages', messages);
  }
}