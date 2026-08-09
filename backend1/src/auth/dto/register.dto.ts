import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength, Matches, IsOptional, IsIn } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(128, { message: 'Password must be less than 128 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  first_name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  last_name: string;

 @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  @MaxLength(20)
  phone_number: string;

  // ✅ ADDED: Allow gender from the frontend
  @IsOptional()
  @IsString()
  @IsIn(['M', 'F', 'O'], { message: 'Gender must be M, F, or O' })
  gender?: string;

  @IsOptional()
  @IsString()
  admin_secret?: string;
}