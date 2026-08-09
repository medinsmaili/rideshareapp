import {
  Injectable,
  BadRequestException,
  Inject,
  forwardRef,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private readonly ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY;

  constructor(
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async validateUser(identifier: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmailOrPhone(identifier);
    if (!user) {
      await bcrypt.hash('dummy', 10);
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(pass, user.password_hash);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    const { password_hash, email_verification_code, ...result } = user;
    return result;
  }

  async login(user: any) {
    if (user.is_banned) {
      const now = new Date();
      if (user.ban_expires_at && now > new Date(user.ban_expires_at)) {
        await this.usersService.update(user.id, {
          is_banned: false,
          ban_reason: null,
          ban_expires_at: null,
        });
        user.is_banned = false;
      } else {
        throw new ForbiddenException({
          message: 'Your account has been banned.',
          reason: user.ban_reason || 'Violation of terms.',
          expires_at: user.ban_expires_at ? user.ban_expires_at : 'Permanent',
        });
      }
    }

    if (!user.is_email_verified) {
      throw new ForbiddenException('Please verify your email before logging in');
    }

    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: user,
    };
  }

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new BadRequestException('Email already exists');

    if (dto.phone_number) {
      const existingPhone = await this.usersService.findByPhone(dto.phone_number);
      if (existingPhone) throw new BadRequestException('Phone number already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const code = crypto.randomInt(100000, 999999).toString();

    let role = 'user';
    if (this.ADMIN_SECRET_KEY && dto.admin_secret === this.ADMIN_SECRET_KEY) {
      role = 'admin';
    }

    // ✅ ADDED: Pass dto.gender into the database creation
    const newUser = await this.usersService.create({
      email: dto.email,
      password_hash: hashedPassword,
      first_name: dto.first_name,
      last_name: dto.last_name,
      phone_number: dto.phone_number,
      gender: dto.gender, // Passed from frontend
      role: role,
      email_verification_code: code,
      is_email_verified: false,
    });

    try {
      await this.mailService.sendVerificationCode(dto.email, code);
    } catch (error: any) {
      console.error(`Failed to send verification email to ${dto.email}`);
      if (process.env.NODE_ENV !== 'production') {
        console.log(`DEV ONLY - Verification code for ${dto.email}: ${code}`);
      }
    }

    const { password_hash, email_verification_code, ...result } = newUser;
    return result;
  }

  async verifyEmail(email: string, code: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new NotFoundException('User not found');

    if (user.email_verification_code !== code) {
      throw new BadRequestException('Invalid verification code');
    }

    await this.usersService.update(user.id, {
      is_email_verified: true,
      email_verification_code: null,
    } as any);

    return { message: 'Email verified successfully' };
  }

  async resendVerificationCode(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new NotFoundException('User not found');

    const code = crypto.randomInt(100000, 999999).toString();

    await this.usersService.update(user.id, {
      email_verification_code: code,
    } as any);

    try {
      await this.mailService.sendVerificationCode(email, code);
    } catch (error: any) {
      console.error(`Failed to send verification email to ${email}`);
      if (process.env.NODE_ENV !== 'production') {
        console.log(`DEV ONLY - Verification code: ${code}`);
      }
    }
    return { message: 'Verification code resent' };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return { message: 'If this email exists, a reset code has been sent' };
    }

    const code = crypto.randomInt(100000, 999999).toString();

    await this.usersService.update(user.id, {
      email_verification_code: code,
    } as any);

    try {
      await this.mailService.sendVerificationCode(email, code);
    } catch (error) {
      console.error(`Failed to send reset email to ${email}`);
      if (process.env.NODE_ENV !== 'production') {
        console.log(`DEV ONLY - Reset code: ${code}`);
      }
    }
    return { message: 'If this email exists, a reset code has been sent' };
  }

  async resetPassword(email: string, code: string, newPass: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new NotFoundException('User not found');
    if (user.email_verification_code !== code) {
      throw new BadRequestException('Invalid or expired code');
    }

    const hashedPassword = await bcrypt.hash(newPass, 12);

    await this.usersService.update(user.id, {
      password_hash: hashedPassword,
      email_verification_code: null,
    } as any);

    return { message: 'Password reset successfully' };
  }
}