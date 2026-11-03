export const AuthStrategy = {
  JWT: 'jwt',
} as const;

export type AuthStrategyType = (typeof AuthStrategy)[keyof typeof AuthStrategy];
