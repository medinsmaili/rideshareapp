import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Translation } from './translation.entity';
import { TranslationsService } from './translations.service';
import { TranslationsController, AppTranslationsController } from './translations.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Translation])],
  providers: [TranslationsService],
  controllers: [TranslationsController, AppTranslationsController],
  exports: [TranslationsService],
})
export class TranslationsModule {}