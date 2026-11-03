export const AuthRoute = {
  BASE: 'auth',
  SIGNUP: 'signup',
  SIGNIN: 'signin',
  SIGNOUT: 'signout',
  VERIFY_EMAIL: 'verify-email',
  VERIFY_2FA: 'verify-2fa',
  REFRESH: 'refresh',
  CSRF: 'csrf',
} as const;

export const AuthURL = {
  VERIFY_EMAIL: (token: string) =>
    `/${AuthRoute.BASE}/${AuthRoute.VERIFY_EMAIL}?${AuthQuery.TOKEN}=${token}`,
  VERIFY_2FA: (token: string) =>
    `/${AuthRoute.BASE}/${AuthRoute.VERIFY_2FA}?${AuthQuery.TOKEN}=${token}`,
} as const;

export const AuthQuery = {
  TOKEN: 'token',
} as const;

export const AuthRedirectQuery = {
  VERIFIED: '?verified=true',
} as const;
