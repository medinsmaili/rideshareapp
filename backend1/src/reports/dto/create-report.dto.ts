import { IsString, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';

export class CreateReportDto {
  @IsUUID() @IsNotEmpty()
  reported_user_id: string;

  @IsUUID() @IsOptional()
  ride_id: string;

  @IsString() @IsNotEmpty()
  reason: string;
}