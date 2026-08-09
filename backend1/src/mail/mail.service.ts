import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class MailService {
  constructor(private settingsService: SettingsService) {}

  private async buildTransporter() {
    const host = (await this.settingsService.getString('smtp_host', process.env.SMTP_HOST || '')).replace(/"/g, '').trim();
    const user = (await this.settingsService.getString('smtp_user', process.env.SMTP_USER || '')).replace(/"/g, '').trim();
    const pass = (await this.settingsService.getString('smtp_pass', process.env.SMTP_PASS || '')).replace(/"/g, '').trim();
    const portStr = (await this.settingsService.getString('smtp_port', process.env.SMTP_PORT || '587')).trim();
    const port = parseInt(portStr, 10) || 587;

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
    return { transporter, host, port, user };
  }

  private async getFromHeader(): Promise<string> {
    const senderEmail = (await this.settingsService.getString('mail_from', process.env.MAIL_FROM || 'noreply@nisu.app'))
      .replace(/"/g, '').trim();
    const fromName = (await this.settingsService.getString('mail_from_name', 'Nisu App')).replace(/"/g, '').trim() || 'Nisu App';
    return `"${fromName}" <${senderEmail}>`;
  }

  private interpolate(template: string, vars: Record<string, string>): string {
    return Object.keys(vars).reduce(
      (acc, k) => acc.replace(new RegExp(`{{\\s*${k}\\s*}}`, 'g'), vars[k] ?? ''),
      template,
    );
  }

  async sendSupportEmail(opts: {
    fromName: string;
    fromEmail: string;
    category: string;
    subject: string;
    message: string;
  }) {
    try {
      const { transporter } = await this.buildTransporter();
      const from = await this.getFromHeader();
      const supportTo = await this.settingsService.getString('support_email_to', 'medin.smaili@gmail.com');

      await transporter.sendMail({
        from,
        to: supportTo,
        replyTo: opts.fromEmail || undefined,
        subject: `[Support] ${opts.category}: ${opts.subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 24px; color: #333; max-width: 600px;">
            <h2 style="color: #14b8a6; margin-bottom: 4px;">New Support Request</h2>
            <p style="color:#64748b; margin-top:0;">Received via Nisu App</p>
            <hr style="border:none; border-top:1px solid #e2e8f0; margin: 16px 0;" />
            <table style="width:100%; border-collapse:collapse;">
              <tr><td style="padding:6px 0; font-weight:bold; width:120px;">Category:</td><td>${opts.category}</td></tr>
              <tr><td style="padding:6px 0; font-weight:bold;">From:</td><td>${opts.fromName} &lt;${opts.fromEmail}&gt;</td></tr>
              <tr><td style="padding:6px 0; font-weight:bold;">Subject:</td><td>${opts.subject}</td></tr>
            </table>
            <hr style="border:none; border-top:1px solid #e2e8f0; margin: 16px 0;" />
            <h3 style="margin-bottom:8px;">Message:</h3>
            <div style="background:#f8fafc; border-radius:8px; padding:16px; white-space:pre-wrap;">${opts.message}</div>
          </div>
        `,
      });
      console.log(`[Support] Email forwarded to ${supportTo} from ${opts.fromEmail}`);
    } catch (error) {
      console.error('[Support] Failed to send support email:', error);
      throw error;
    }
  }

  async sendVerificationCode(email: string, code: string, lang: 'en' | 'sq' = 'en') {
    try {
      const { transporter } = await this.buildTransporter();
      const from = await this.getFromHeader();

      const defaultSubject = lang === 'sq' ? 'Kodi juaj i verifikimit 🔐' : 'Your Verification Code 🔐';
      const defaultHtml = lang === 'sq'
        ? `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #3498db;">Mirë se erdhe në Nisu! 🚗</h2>
            <p>Përdor kodin më poshtë për të verifikuar llogarinë tënde:</p>
            <h1 style="background: #f4f4f4; padding: 10px; display: inline-block; border-radius: 5px;">{{code}}</h1>
            <p>Nëse nuk e ke kërkuar këtë, injoroje këtë email.</p>
          </div>`
        : `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #3498db;">Welcome to Nisu! 🚗</h2>
            <p>Please use the code below to verify your account:</p>
            <h1 style="background: #f4f4f4; padding: 10px; display: inline-block; border-radius: 5px;">{{code}}</h1>
            <p>If you didn't request this, please ignore this email.</p>
          </div>`;

      const subjectTemplate = await this.settingsService.getString(`email_verification_subject_${lang}`, defaultSubject);
      const htmlTemplate = await this.settingsService.getString(`email_verification_html_${lang}`, defaultHtml);

      const subject = this.interpolate(subjectTemplate, { code });
      const html = this.interpolate(htmlTemplate, { code });

      console.log(`📨 Sending verification email → ${email} (lang=${lang})`);
      await transporter.sendMail({
        from,
        to: email,
        subject,
        text: this.interpolate(`Welcome to Nisu! Your verification code is: {{code}}`, { code }),
        html,
      });
      console.log(`✅ Verification email sent to ${email}`);
    } catch (error) {
      console.error('❌ Verification email failed:', error);
    }
  }

  async sendTestEmail(to: string) {
    const { transporter, host, port, user } = await this.buildTransporter();
    const from = await this.getFromHeader();
    await transporter.sendMail({
      from,
      to,
      subject: 'Nisu — SMTP Test',
      text: `SMTP test OK.\nHost: ${host}\nPort: ${port}\nUser: ${user}`,
      html: `<div style="font-family:Arial;padding:16px;"><h2>SMTP test ✅</h2><p>Host: <code>${host}</code></p><p>Port: <code>${port}</code></p><p>User: <code>${user}</code></p></div>`,
    });
  }
}
