import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { ZodValidationPipe } from '@anatine/zod-nestjs';
import { ConfigService } from '@/config';
import {
  CORS,
  GlobalHttpExceptionFilter,
  ResponseInterceptor,
  Upload,
} from '@/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const config = app.get(ConfigService);
  const PORT = config.PORT;
  const CLIENT_URL = config.CLIENT_URL;

  // Security middleware
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      crossOriginEmbedderPolicy: false, // disable if you load external assets
    }),
  );

  // Enable CORS
  app.enableCors(CORS(CLIENT_URL));

  // Static file serving (e.g., for profile pics)
  app.useStaticAssets(join(process.cwd(), Upload.FOLDER_NAME), {
    prefix: Upload.STATIC_PREFIX,
  });

  // Global pipe for DTO validation and transformation
  app.useGlobalPipes(new ZodValidationPipe());

  // Global interceptors & filters
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new GlobalHttpExceptionFilter());

  // Cookie parser
  app.use(cookieParser());

  // Start the server
  await app.listen(PORT);
}

bootstrap().catch((error) => console.error(error));
