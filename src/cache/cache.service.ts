import { Injectable } from '@nestjs/common';
import { RedisService } from '@/infra/redis';
import { AuthRedis } from './constants';

@Injectable()
export class CacheService {
  constructor(private readonly redis: RedisService) {}

  /**
   * Email verification
   */
  async setEmailVerification(token: string, data: object) {
    await this.redis.set(
      AuthRedis.EmailVerification.Key.VERIFY_EMAIL(token),
      data,
      AuthRedis.EmailVerification.TTL,
    );
  }

  async getEmailVerification<T>(token: string): Promise<T> {
    return this.redis.get(
      AuthRedis.EmailVerification.Key.VERIFY_EMAIL(token),
    ) as T;
  }

  async delEmailVerification(token: string) {
    await this.redis.del(AuthRedis.EmailVerification.Key.VERIFY_EMAIL(token));
  }

  /**
   * 2FA verification
   */
  async set2FAVerification(token: string, data: object) {
    await this.redis.set(
      AuthRedis.EmailVerification.Key.VERIFY_2FA(token),
      data,
      AuthRedis.EmailVerification.TTL,
    );
  }

  async get2FAVerification<T>(token: string): Promise<T> {
    return this.redis.get(
      AuthRedis.EmailVerification.Key.VERIFY_2FA(token),
    ) as T;
  }

  async del2FAVerification(token: string) {
    await this.redis.del(AuthRedis.EmailVerification.Key.VERIFY_2FA(token));
  }

  /**
   * JWT blacklist
   */
  async blacklistJti(jti: string, ttl: number) {
    await this.redis.set(
      AuthRedis.BlackListJti.KEY(jti),
      AuthRedis.BlackListJti.VALUE,
      ttl,
    );
  }
}
