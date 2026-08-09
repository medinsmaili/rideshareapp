// ✅ FIX #10: Login accepts "identifier" which can be email or phone
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  identifier: string; // email or phone number

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  password: string;
}
