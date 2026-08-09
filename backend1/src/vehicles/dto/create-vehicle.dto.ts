import { IsString, IsNotEmpty } from 'class-validator';

export class CreateVehicleDto {
  @IsString() @IsNotEmpty()
  brand: string; // e.g., "VW Golf"

  @IsString() @IsNotEmpty()
  color: string; // e.g., "Black"

  @IsString() @IsNotEmpty()
  license_plate: string; // e.g., "AB-123-CD"
}