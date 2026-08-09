import { IsOptional, IsString, MaxLength, IsIn } from 'class-validator';

/**
 * SECURITY FIX: Whitelist only fields users are allowed to update.
 * This prevents privilege escalation (e.g., setting role: 'admin').
 * Fields like role, is_banned, is_verified_driver are NOT included.
 */
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  first_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  last_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone_number?: string;

  @IsOptional()
  @IsString()
  @IsIn(['M', 'F'], { message: 'Gender must be M or F' })
  gender?: string;
}
