// import { Injectable, UnauthorizedException } from '@nestjs/common';
// import { AuthGuard } from '@nestjs/passport';
// import { AuthStrategy, JwtError } from '@/common/constants';

// @Injectable()
// export class JwtGuard extends AuthGuard(AuthStrategy.JWT) {
//   handleRequest(err: any, user: any, info: any) {
//     if (err || !user) {
//       if (!info) {
//         throw new UnauthorizedException(JwtError.Msg.TOKEN_MISSING);
//       }

//       if (info?.name === JwtError.Type.TOKEN_EXPIRED) {
//         throw new UnauthorizedException(JwtError.Msg.TOKEN_EXPIRED);
//       }

//       if (
//         info?.message?.includes(JwtError.Type.MALFORMED) ||
//         info?.message?.includes(JwtError.Type.INVALID)
//       ) {
//         throw new UnauthorizedException(JwtError.Msg.TOKEN_INVALID);
//       }

//       throw new UnauthorizedException(JwtError.Msg.UNAUTHORIZED);
//     }

//     return user;
//   }
// }
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthStrategy, JwtError, ErrorCode } from '@/common/constants';

@Injectable()
export class JwtGuard extends AuthGuard(AuthStrategy.JWT) {
  handleRequest(err: any, user: any, info: any) {
    // 🟢 1. If strategy threw a custom UnauthorizedException → forward it unchanged
    if (err instanceof UnauthorizedException) {
      throw err;
    }

    // 🟡 2. If no user AND no info → token missing
    if (!user && !info) {
      throw new UnauthorizedException({
        message: JwtError.Msg.TOKEN_MISSING,
        code: ErrorCode.ACCESS_TOKEN_MISSING,
      });
    }

    // 🔴 3. Expired token
    if (info?.name === JwtError.Type.TOKEN_EXPIRED) {
      throw new UnauthorizedException({
        message: JwtError.Msg.TOKEN_EXPIRED,
        code: ErrorCode.ACCESS_TOKEN_EXPIRED,
      });
    }

    // 🔵 4. Invalid or malformed token
    if (
      info?.message?.includes(JwtError.Type.MALFORMED) ||
      info?.message?.includes(JwtError.Type.INVALID)
    ) {
      throw new UnauthorizedException({
        message: JwtError.Msg.TOKEN_INVALID,
        code: ErrorCode.ACCESS_TOKEN_INVALID,
      });
    }

    // ⚫ 5. Default unauthorized
    if (!user) {
      throw new UnauthorizedException({
        message: JwtError.Msg.UNAUTHENTICATED,
        code: ErrorCode.UNAUTHENTICATED,
      });
    }

    return user;
  }
}
