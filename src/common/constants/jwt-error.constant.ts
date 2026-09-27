export const JwtError = {
  Msg: {
    TOKEN_MISSING: 'Access token is missing',
    TOKEN_INVALID: 'Invalid access token',
    TOKEN_EXPIRED: 'Access token is expired',
    UNAUTHENTICATED: 'Authentication required',
  },
  Type: {
    TOKEN_EXPIRED: 'TokenExpiredError',
    MALFORMED: 'malformed',
    INVALID: 'invalid',
  },
} as const;
