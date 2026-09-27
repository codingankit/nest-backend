export const TokenType = {
  ACCESS: 'ACCESS',
  REFRESH: 'REFRESH',
} as const;

export type TokenType = (typeof TokenType)[keyof typeof TokenType];
