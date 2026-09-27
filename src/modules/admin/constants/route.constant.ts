import { AuthQuery } from '@/modules/auth/constants';

const BASE = 'admin' as const;

export const AdminRoute = {
  BASE,
  Profile: {
    BASE: `${BASE}/profile`,
    EMAIL: 'email',
    VERIFY_EMAIL: 'verify-email',
  },
} as const;

export const AdminURL = {
  VERIFY_EMAIL: (token: string) =>
    `/${AdminRoute.Profile.BASE}/${AdminRoute.Profile.VERIFY_EMAIL}?${
      AuthQuery.TOKEN
    }=${token}`,
} as const;
