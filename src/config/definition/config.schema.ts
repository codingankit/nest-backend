import { z } from 'zod';
import { Env } from '@/common';

export const configSchema = z.object({
  ENV: z.enum([Env.DEV, Env.PROD, Env.TEST]).default(Env.DEV),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().trim(),
  CLIENT_URL: z.string().url().trim(),
  REDIS_HOST: z.string().trim().default('127.0.0.1'),
  REDIS_PORT: z.coerce.number().min(1).max(65535).default(6379),
  REDIS_PASS: z.string().trim().optional(),
  CSRF_SECRET: z.string().trim(),
  JWT_ACCESS_SECRET: z.string().trim(),
  JWT_REFRESH_SECRET: z.string().trim(),
  JWT_ACCESS_EXPIRES_IN: z.string().trim().min(2),
  JWT_REFRESH_EXPIRES_IN: z.string().trim().min(2),
  SMTP_HOST: z.string().trim(),
  SMTP_PORT: z.coerce.number().min(1).max(65535),
  SMTP_USER: z.string().trim(),
  SMTP_PASS: z.string().trim(),
});

export type ConfigSchema = z.infer<typeof configSchema>;
