import { Controller, Post, Body, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MailService } from './mail.service';

@Controller()
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Post('support')
  @UseGuards(AuthGuard('jwt'))
  async sendSupportMessage(
    @Body() body: { category: string; subject: string; message: string; from_name: string; from_email: string },
    @Request() req: any,
  ) {
    await this.mailService.sendSupportEmail({
      fromName: body.from_name || `${req.user.first_name || ''} ${req.user.last_name || ''}`.trim(),
      fromEmail: body.from_email || req.user.email,
      category: body.category || 'General',
      subject: body.subject,
      message: body.message,
    });
    return { status: 'sent', message: 'Your message has been sent to support.' };
  }

  @Post('mail/test')
  @UseGuards(AuthGuard('jwt'))
  async sendTestEmail(@Body() body: { to?: string }, @Request() req: any) {
    if (req.user.role !== 'admin') throw new BadRequestException('Admin only');
    const to = (body.to || req.user.email || '').trim();
    if (!to) throw new BadRequestException('Recipient required');
    try {
      await this.mailService.sendTestEmail(to);
      return { status: 'sent', to };
    } catch (err: any) {
      throw new BadRequestException(err?.message || 'SMTP test failed');
    }
  }
}
