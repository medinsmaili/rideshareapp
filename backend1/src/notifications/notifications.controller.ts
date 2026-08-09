import { Controller, Post, Body, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UsersService } from '../users/users.service';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly usersService: UsersService,
  ) {}

  @Post('test')
  @UseGuards(AuthGuard('jwt'))
  async sendTestNotification(@Request() req) {
    const user = req.user;

    // v2 API: external_id is user.id (UUID)
    await this.notificationsService.sendNotification(
      [user.id],
      'Test Notification',
      'If you see this, OneSignal is working! 🚀',
      { type: 'test' }
    );

    return { status: 'success', message: 'Notification sent to your device' };
  }

  @Post('broadcast')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  async broadcastNotification(
    @Body() body: { title: string; message: string; audience: 'all' | 'drivers' | 'specific'; user_id?: string },
    @Request() req,
  ) {
    const { title, message, audience, user_id } = body;

    if (!title?.trim() || !message?.trim()) {
      throw new BadRequestException('Title and message are required');
    }

    let targetIds: string[] = [];

    if (audience === 'specific') {
      if (!user_id) throw new BadRequestException('user_id is required for specific audience');
      const user = await this.usersService.findOne(user_id);
      targetIds = [user.id];
    } else {
      const allUsers = await this.usersService.findAll();
      const filtered = audience === 'drivers'
        ? allUsers.filter(u => u.is_verified_driver)
        : allUsers;
      targetIds = filtered.map(u => u.id).filter(Boolean);
    }

    if (targetIds.length === 0) {
      return { status: 'no_targets', message: 'No users with active devices found', recipients: 0 };
    }

    await this.notificationsService.sendNotification(targetIds, title.trim(), message.trim(), { type: 'broadcast', sent_by: req.user.id });

    return { status: 'success', message: `Notification sent`, recipients: targetIds.length };
  }
}
