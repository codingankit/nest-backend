import {
  Injectable,
  OnApplicationShutdown,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PostSlugExtension, Uuidv7Extension } from './extensions';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { ConfigService } from '@/config';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy, OnApplicationShutdown
{
  constructor(config: ConfigService) {
    const pool = new Pool({
      connectionString: config.DATABASE_URL,
    });
    const adapter = new PrismaPg(pool);

    // 3. Pass the adapter object directly into the parent constructor
    super({ adapter });

    // 4. Apply your client extensions on top of the configured runtime instance
    const extended = this.$extends(Uuidv7Extension).$extends(PostSlugExtension);
    Object.assign(this, extended);
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async onApplicationShutdown() {
    await this.$disconnect();
  }
}
