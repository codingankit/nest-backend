import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis, { type ChainableCommander } from 'ioredis';
import { ConfigService } from '@/config';
import { RedisExpiryMode } from '@/common';
import { RedisConfig, RedisEvent, RedisMessage } from './constants';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly redis: Redis;

  constructor(private readonly config: ConfigService) {
    this.redis = new Redis({
      host: this.config.REDIS_HOST,
      port: this.config.REDIS_PORT,
      password: this.config.REDIS_PASS || undefined,
      db: RedisConfig.DB,
      retryStrategy(times: number) {
        return Math.min(
          times * RedisConfig.RETRY_MULTIPLIER,
          RedisConfig.RETRY_MAX_DELAY,
        );
      },
    });

    this.redis.on(RedisEvent.CONNECT, () =>
      console.log(RedisMessage.CONNECTED),
    );
    this.redis.on(RedisEvent.ERROR, (err) =>
      console.error(RedisMessage.ERROR, err),
    );
    this.redis.on(RedisEvent.END, () =>
      console.warn(RedisMessage.DISCONNECTED),
    );
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.redis.ping();
      console.log(RedisMessage.VERIFIED);
    } catch (error) {
      console.error(RedisMessage.PING_FAILED, error);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
    console.log(RedisMessage.CLOSED);
  }

  async set(
    key: string,
    value: unknown,
    ttl?: number,
    mode: RedisExpiryMode = RedisExpiryMode.EX,
  ): Promise<boolean> {
    try {
      const finalValue =
        typeof value === 'object' && value !== null
          ? JSON.stringify(value)
          : String(value);

      const args: (string | number)[] = [];

      // Only apply expiry if TTL is explicitly provided and > 0
      if (typeof ttl === 'number' && ttl > 0) {
        if (mode !== RedisExpiryMode.KEEPTTL) {
          args.push(RedisExpiryMode[mode], ttl);
        } else {
          args.push(RedisExpiryMode.KEEPTTL);
        }
      }

      await (
        this.redis.set as unknown as (
          key: string,
          value: string,
          ...args: (string | number)[]
        ) => Promise<'OK' | null>
      )(key, finalValue, ...args);

      return true;
    } catch {
      return false;
    }
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    try {
      const raw = await this.redis.get(key);
      if (!raw) return null;

      // Try parsing JSON
      if (
        (raw.startsWith('{') && raw.endsWith('}')) ||
        (raw.startsWith('[') && raw.endsWith(']'))
      ) {
        try {
          return JSON.parse(raw) as T;
        } catch {
          return raw as T;
        }
      }

      // Try parsing number
      if (!isNaN(Number(raw))) return Number(raw) as unknown as T;

      return raw as T;
    } catch {
      return null;
    }
  }

  async del(key: string): Promise<boolean> {
    return (await this.redis.del(key)) === 1;
  }

  async exists(key: string): Promise<boolean> {
    return (await this.redis.exists(key)) === 1;
  }

  async increment(key: string): Promise<number> {
    return this.redis.incr(key);
  }

  async keys(
    pattern = RedisConfig.DEFAULT_PATTERN,
    count = 100,
  ): Promise<string[]> {
    const result: string[] = [];
    let cursor = '0';

    do {
      // Scan returns [newCursor, keys[]]
      const [newCursor, keys] = await this.redis.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        count,
      );
      cursor = newCursor;
      result.push(...keys);
    } while (cursor !== '0');

    return result;
  }

  async flushAll(): Promise<boolean> {
    try {
      await this.redis.flushall();
      return true;
    } catch {
      return false;
    }
  }

  // -----------------------
  // Pipeline Support (Unified)
  // -----------------------
  /**
   * Creates a Redis pipeline for advanced use.
   */
  pipeline(): ChainableCommander {
    return this.redis.pipeline();
  }

  /**
   * Set multiple keys via pipeline.
   * Works for both JSON and normal values.
   */
  async setMany(
    items: Record<string, unknown>,
    ttl?: number, // made optional
    mode: RedisExpiryMode = RedisExpiryMode.EX,
  ): Promise<string[]> {
    const keys = Object.keys(items);
    if (!keys.length) return [];

    const pipeline = this.redis.pipeline();

    for (const [key, value] of Object.entries(items)) {
      const finalValue =
        typeof value === 'object' && value !== null
          ? JSON.stringify(value)
          : String(value);

      const args: (string | number)[] = [];

      // ✅ Only apply expiry if ttl is explicitly provided and > 0
      if (typeof ttl === 'number' && ttl > 0) {
        if (mode !== RedisExpiryMode.KEEPTTL) {
          args.push(RedisExpiryMode[mode], ttl);
        } else {
          args.push(RedisExpiryMode.KEEPTTL);
        }
      }

      (
        pipeline.set as unknown as (
          key: string,
          value: string,
          ...args: (string | number)[]
        ) => ChainableCommander
      )(key, finalValue, ...args);
    }

    const results = (await pipeline.exec()) ?? [];

    // 🔍 Collect keys that failed to set
    const failedKeys: string[] = [];
    keys.forEach((key, index) => {
      const [err, reply] = results[index];
      if (err || reply !== 'OK') failedKeys.push(key);
    });

    return failedKeys;
  }

  /**
   * Get multiple keys via pipeline.
   * Auto parse JSON,Numbers & Booleans.
   */
  async getMany(...keys: string[]): Promise<Record<string, unknown | null>> {
    if (!keys.length) return {};

    const pipeline = this.redis.pipeline();
    keys.forEach((key) => pipeline.get(key));

    const results = (await pipeline.exec()) ?? [];
    const data: Record<string, unknown | null> = {};

    keys.forEach((key, i) => {
      const [err, reply] = results[i];
      if (err || reply === null) {
        data[key] = null;
        return;
      }

      const value = reply as string;

      // Auto-detect JSON
      if (
        (value.startsWith('{') && value.endsWith('}')) ||
        (value.startsWith('[') && value.endsWith(']'))
      ) {
        try {
          data[key] = JSON.parse(value);
          return;
        } catch {
          // fall through
        }
      }

      // Auto-detect numbers
      if (!isNaN(Number(value)) && value.trim() !== '') {
        data[key] = Number(value);
        return;
      }

      // Auto-detect booleans
      if (value === 'true') {
        data[key] = true;
        return;
      }
      if (value === 'false') {
        data[key] = false;
        return;
      }

      // Fallback: string
      data[key] = value;
    });

    return data;
  }

  /**
   * Batch delete multiple keys using a pipeline.
   */
  async delMany(...keys: string[]): Promise<string[]> {
    if (!keys.length) return [];

    const pipeline = this.redis.pipeline();
    keys.forEach((key) => pipeline.del(key));

    const results = (await pipeline.exec()) ?? [];

    // Only return keys that failed to delete
    const failedKeys: string[] = [];
    keys.forEach((key, index) => {
      const [err, deletedCount] = results[index];
      if (err || deletedCount === 0) {
        failedKeys.push(key);
      }
    });

    return failedKeys;
  }

  get client(): Redis {
    return this.redis;
  }
}
