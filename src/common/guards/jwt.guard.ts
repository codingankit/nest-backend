import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthStrategy, JwtError, ErrorCode } from '@/common/constants';

interface JwtInfo {
  name?: string;
  message?: string;
}

@Injectable()
export class JwtGuard extends AuthGuard(AuthStrategy.JWT) {
  handleRequest<TUser = unknown>(
    err: unknown,
    user: TUser | false,
    info?: JwtInfo,
  ): TUser {
    // 1. Strategy threw a custom UnauthorizedException -> forward unchanged
    if (err instanceof UnauthorizedException) {
      throw err;
    }

    // 2. No user and no info -> token missing
    if (!user && !info) {
      throw new UnauthorizedException({
        message: JwtError.Msg.TOKEN_MISSING,
        code: ErrorCode.ACCESS_TOKEN_MISSING,
      });
    }

    // 3. Expired token
    if (info?.name === JwtError.Type.TOKEN_EXPIRED) {
      throw new UnauthorizedException({
        message: JwtError.Msg.TOKEN_EXPIRED,
        code: ErrorCode.ACCESS_TOKEN_EXPIRED,
      });
    }

    // 4. Invalid or malformed token
    if (
      info?.message?.includes(JwtError.Type.MALFORMED) ||
      info?.message?.includes(JwtError.Type.INVALID)
    ) {
      throw new UnauthorizedException({
        message: JwtError.Msg.TOKEN_INVALID,
        code: ErrorCode.ACCESS_TOKEN_INVALID,
      });
    }

    // 5. Any other failure (including non-HTTP errors from the strategy)
    if (err || !user) {
      throw new UnauthorizedException({
        message: JwtError.Msg.UNAUTHENTICATED,
        code: ErrorCode.UNAUTHENTICATED,
      });
    }

    return user;
  }
}
