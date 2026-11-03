export const AuthRedis = {
  EmailVerification: {
    Key: {
      VERIFY_EMAIL: (token: string) => `verify-email:${token}`,
      VERIFY_2FA: (token: string) => `verify-2fa:${token}`,
    },
    TTL: 5 * 60, // 5 minutes in seconds
  },
  BlackListJti: {
    KEY: (jti: string) => `bl:${jti}`,
    VALUE: 'revoked',
  },
} as const;
