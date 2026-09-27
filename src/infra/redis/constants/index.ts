export const RedisConfig = {
  DB: 0,
  DEAFULT_TTL: 60,
  RETRY_MULTIPLIER: 100,
  RETRY_MAX_DELAY: 2000,
  DEFAULT_PATTERN: '*',
} as const;

export const RedisEvent = {
  CONNECT: 'connect',
  READY: 'ready',
  ERROR: 'error',
  END: 'end',
  RECONNECTING: 'reconnecting',
} as const;

export const RedisMessage = {
  CONNECTED: '[RedisService] Connected to Redis.',
  VERIFIED: '[RedisService] Connection verified via PING.',
  DISCONNECTED: '[RedisService] Redis connection closed.',
  ERROR: '[RedisService] Redis error:',
  CLOSED: '[RedisService] Redis client closed.',
  PING_FAILED: '[RedisService] Redis ping failed:',
} as const;
