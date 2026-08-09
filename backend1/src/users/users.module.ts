import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './user.entity';
import { AuthModule } from '../auth/auth.module'; // ✅ Import this

@Module({
  // ✅ FIX: Add AuthModule (use forwardRef if you have a circular dependency)
  imports: [
    TypeOrmModule.forFeature([User]),
    forwardRef(() => AuthModule) 
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}