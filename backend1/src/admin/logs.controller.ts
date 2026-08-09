import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import * as fs from 'fs';
import * as path from 'path';

@Controller('admin/logs')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin')
export class LogsController {
  @Get()
  async getLogs(@Query('lines') linesParam?: string) {
    const maxLines = Math.min(parseInt(linesParam || '500', 10) || 500, 5000);

    // Try common log locations
    const candidates = [
      process.env.LOG_FILE,
      '/var/log/nisu-backend.log',
      path.join(process.cwd(), 'logs', 'app.log'),
      path.join(process.cwd(), 'app.log'),
    ].filter(Boolean) as string[];

    for (const file of candidates) {
      try {
        if (fs.existsSync(file)) {
          const content = fs.readFileSync(file, 'utf8');
          const lines = content.split('\n');
          const tail = lines.slice(-maxLines).join('\n');
          return { source: file, lines: maxLines, content: tail };
        }
      } catch {
        // ignore and try next
      }
    }

    return {
      source: null,
      lines: 0,
      content: 'No log file found. Set LOG_FILE env var to point at a log file (e.g. /var/log/nisu-backend.log) or write logs to ./logs/app.log',
    };
  }
}
