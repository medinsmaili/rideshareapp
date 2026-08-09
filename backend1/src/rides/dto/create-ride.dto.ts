import { IsNotEmpty, IsUUID, IsDateString, IsInt, Min, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class CreateRideDto {
  @IsNotEmpty()
  @IsUUID()
  origin_city_id: string;

  @IsNotEmpty()
  @IsUUID()
  destination_city_id: string;

  @IsOptional()
  @IsUUID()
  origin_meeting_point_id?: string;

  @IsOptional()
  @IsUUID()
  destination_meeting_point_id?: string;

  @IsNotEmpty()
  @IsDateString()
  departure_time: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  available_seats: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  price_per_seat: number;

  @IsOptional()
  @IsUUID()
  vehicle_id?: string;

  @IsOptional()
  @IsBoolean()
  is_student_pricing?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  student_price_per_seat?: number;

  // ✅ FIX: Tell NestJS that female_only is a valid, optional boolean
  @IsOptional()
  @IsBoolean()
  female_only?: boolean;
}