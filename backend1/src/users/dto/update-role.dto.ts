import { IsNotEmpty, IsString, IsIn } from 'class-validator';

export class UpdateRoleDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['user', 'admin'], { message: 'Role must be user or admin' })
  role: string;
}
