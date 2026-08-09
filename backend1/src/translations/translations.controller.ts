import { Controller, Get, Post, Put, Delete, Body, Param, Query, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TranslationsService } from './translations.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import type { Response } from 'express';

@Controller('translations')
export class TranslationsController {
  constructor(private readonly translationsService: TranslationsService) {}

  /** GET /translations?lang=en — Mobile app fetches translations */
  @Get()
  async getTranslations(@Query('lang') lang: string = 'en') {
    return this.translationsService.getTranslationsForApp(lang);
  }
}

/** Admin CRUD at /app_translations */
@Controller('app_translations')
export class AppTranslationsController {
  constructor(private readonly translationsService: TranslationsService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  async list(
    @Query('_start') start: string,
    @Query('_end') end: string,
    @Query('_sort') sort: string,
    @Query('_order') order: string,
    @Query('language_id') languageId: string,
    @Query('q') q: string,
    @Res() res: Response,
  ) {
    const filter: any = {};
    if (languageId) filter.language_id = languageId;
    if (q) filter.q = q;

    const [data, total] = await this.translationsService.findAllAndCount(filter);

    // Apply pagination
    const s = parseInt(start) || 0;
    const e = parseInt(end) || 25;
    const paged = data.slice(s, e);

    res.set('Access-Control-Expose-Headers', 'Content-Range');
    res.set('Content-Range', `app_translations ${s}-${Math.min(e, total)}/${total}`);
    return res.json(paged);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async getOne(@Param('id') id: string) {
    return this.translationsService.findOne(parseInt(id));
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  async create(@Body() body: any) {
    return this.translationsService.create(body);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.translationsService.update(parseInt(id), body);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  async remove(@Param('id') id: string) {
    await this.translationsService.remove(parseInt(id));
    return { id: parseInt(id) };
  }
}
