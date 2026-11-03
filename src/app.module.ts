import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from '@/config';
import { PrismaModule } from '@/infra/prisma';
import { CacheModule } from '@/cache';
import { EmailModule } from '@/infra/email';
import { RedisModule } from '@/infra/redis';
import { AuthModule } from '@/modules/auth';
import { AdminModule } from '@/modules/admin';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    EmailModule,
    RedisModule,
    CacheModule,
    AuthModule,
    AdminModule,
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 60,
          blockDuration: 300000,
        },
      ],
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
