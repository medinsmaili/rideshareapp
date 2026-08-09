import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as fs from 'fs';

// Mirror console output to ./logs/app.log so the admin panel Logs viewer has a source
function setupFileLogging() {
  try {
    const logDir = join(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    const logFile = join(logDir, 'app.log');
    const stream = fs.createWriteStream(logFile, { flags: 'a' });

    const origLog = console.log.bind(console);
    const origErr = console.error.bind(console);
    const origWarn = console.warn.bind(console);
    const fmt = (level: string, args: any[]) =>
      `[${new Date().toISOString()}] [${level}] ${args.map(a => typeof a === 'string' ? a : (() => { try { return JSON.stringify(a); } catch { return String(a); } })()).join(' ')}\n`;

    console.log = (...args: any[]) => { stream.write(fmt('LOG', args)); origLog(...args); };
    console.error = (...args: any[]) => { stream.write(fmt('ERR', args)); origErr(...args); };
    console.warn = (...args: any[]) => { stream.write(fmt('WARN', args)); origWarn(...args); };

    process.on('uncaughtException', (e) => stream.write(fmt('FATAL', [e?.stack || e])));
    process.on('unhandledRejection', (e) => stream.write(fmt('FATAL', [String(e)])));
  } catch (e) {
    // Logging bootstrap failure shouldn't crash the server
    console.error('File logging setup failed:', e);
  }
}

async function bootstrap() {
  setupFileLogging();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // ✅ FIX: Serve static images for Profile Avatars
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  app.set('trust proxy', 1);
  app.enableCors();
  
  // ✅ FIX: Allow cross-origin images to be fetched by the React Native app
  app.use(helmet({
    crossOriginResourcePolicy: false, 
  }));

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 300,
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(3000);
}
bootstrap();