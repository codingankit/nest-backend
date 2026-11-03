import { TokenKey } from '@/common/constants';
import { AuthRoute } from './route.constant';

export const Cookie = {
  RefreshToken: {
    KEY: TokenKey.REFRESH,
    OPTIONS: {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 15 * 24 * 60 * 60 * 1000, // 15 Days in Milliseconds
      path: `/${AuthRoute.BASE}`,
    },
  },
} as const;
