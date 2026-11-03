import 'dotenv/config';
import { defineConfig } from '@prisma/config';

export default defineConfig({
  schema: 'src/infra/prisma/schema/schema.prisma',
  migrations: {
    path: 'src/infra/prisma/schema/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL ?? '',
  },
});
