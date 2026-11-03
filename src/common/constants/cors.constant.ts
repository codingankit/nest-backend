import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

export const CORS = (clientUrl: string): CorsOptions => ({
  origin: [clientUrl],
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  // csrf-csrf reads the token from `x-csrf-token` by default
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  credentials: true,
});
