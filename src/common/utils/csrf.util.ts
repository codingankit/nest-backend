import { doubleCsrf } from 'csrf-csrf';
import { ConfigService } from '@/config';
import { TokenKey } from '@/common/constants';
import { AuthRoute } from '@/modules/auth/constants';
import { hmacHash } from './hash.util';

export function createCsrfUtil(config: ConfigService) {
  return doubleCsrf({
    getSecret: () => config.CSRF_SECRET,
    getSessionIdentifier: (req) => {
      const refreshToken = req.cookies[TokenKey.REFRESH];
      return refreshToken ? hmacHash(refreshToken) : '';
    },
    cookieName: TokenKey.CSRF,
    cookieOptions: {
      sameSite: 'strict',
      path: `/${AuthRoute.BASE}/${AuthRoute.REFRESH}`,
      secure: true,
      httpOnly: true,
    },
    size: 64,
  });
}
