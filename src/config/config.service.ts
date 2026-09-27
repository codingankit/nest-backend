import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { Env } from '@/common';
import { ErrorMessage, EnvKey } from './constants';

@Injectable()
export class ConfigService {
  constructor(private readonly config: NestConfigService) {}

  private getOrThrow<T = string>(key: string): T {
    const value = this.config.get<T>(key);
    if (value === undefined || value === null) {
      throw new Error(ErrorMessage.KEY_NOT_DEFINED(key));
    }
    return value;
  }

  get ENV(): Env {
    return this.getOrThrow<Env>(EnvKey.ENV);
  }

  get PORT(): number {
    return Number(this.getOrThrow(EnvKey.PORT));
  }

  get DATABASE_URL(): string {
    return this.getOrThrow(EnvKey.DATABASE_URL);
  }

  get CLIENT_URL(): string {
    return this.getOrThrow(EnvKey.CLIENT_URL);
  }

  get REDIS_HOST(): string {
    return this.getOrThrow(EnvKey.REDIS_HOST);
  }

  get REDIS_PORT(): number {
    return Number(this.getOrThrow(EnvKey.REDIS_PORT));
  }

  get REDIS_PASS(): string | undefined {
    return this.config.get<string>(EnvKey.REDIS_PASS);
  }

  get CSRF_SECRET(): string {
    return this.getOrThrow(EnvKey.CSRF_SECRET);
  }

  get JWT_ACCESS_SECRET(): string {
    return this.getOrThrow(EnvKey.JWT_ACCESS_SECRET);
  }

  get JWT_REFRESH_SECRET(): string {
    return this.getOrThrow(EnvKey.JWT_REFRESH_SECRET);
  }

  get JWT_ACCESS_EXPIRES_IN(): string {
    return this.getOrThrow(EnvKey.JWT_ACCESS_EXPIRES_IN);
  }

  get JWT_REFRESH_EXPIRES_IN(): string {
    return this.getOrThrow(EnvKey.JWT_REFRESH_EXPIRES_IN);
  }

  get SMTP_HOST(): string {
    return this.getOrThrow(EnvKey.SMTP_HOST);
  }

  get SMTP_PORT(): number {
    return Number(this.getOrThrow(EnvKey.SMTP_PORT));
  }

  get SMTP_USER(): string {
    return this.getOrThrow(EnvKey.SMTP_USER);
  }

  get SMTP_PASS(): string {
    return this.getOrThrow(EnvKey.SMTP_PASS);
  }
}
