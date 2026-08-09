import { Controller, Get, Post, Put, Delete, Body, Param, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LanguagesService } from './languages.service';
import type { Response } from 'express';

@Controller('languages')
export class LanguagesController {
  constructor(private service: LanguagesService) {}

  @Get()
  async findAll(@Res() res: Response) {
    const [result, total] = await this.service.findAllAndCount();
    res.set('Access-Control-Expose-Headers', 'Content-Range');
    res.set('Content-Range', `languages 0-${total}/${total}`);
    return res.json(result);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(+id, body);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}