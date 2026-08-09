import { Controller, Get, Param, Put, Body, UseGuards, BadRequestException, Request } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async getAllSettings(@Request() req) {
    if (req.user.role !== 'admin') throw new BadRequestException('Admin only');
    return this.settingsService.findAll(); // Ensure this method is implemented in your service
  }

  @Get('active-ad')
  async getAd() {
    return this.settingsService.getActiveAd();
  }

  @Get(':key')
  async getSetting(@Param('key') key: string) {
    return this.settingsService.getSettingByKey(key);
  }

  @Put(':key')
  @UseGuards(AuthGuard('jwt'))
  async updateSetting(@Param('key') key: string, @Body() body: any, @Request() req) {
    if (req.user.role !== 'admin') throw new BadRequestException('Admin only');
    return this.settingsService.updateSetting(key, body);
  }
}