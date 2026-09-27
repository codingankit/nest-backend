export const RedisExpiryMode = {
  EX: 'EX', // seconds
  PX: 'PX', // milliseconds
  EXAT: 'EXAT', // absolute timestamp in seconds
  PXAT: 'PXAT', // absolute timestamp in milliseconds
  KEEPTTL: 'KEEPTTL', // preserve existing TTL
} as const;

export type RedisExpiryMode = keyof typeof RedisExpiryMode;
