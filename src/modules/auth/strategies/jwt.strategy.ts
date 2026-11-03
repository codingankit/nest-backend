import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@/config';
import { PrismaService } from '@/infra/prisma';
import { RedisService } from '@/infra/redis';
import { AuthStrategy, ErrorCode } from '@/common';
import { AuthMessage, AuthRedis } from '../constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, AuthStrategy.JWT) {
  constructor(
    readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.JWT_ACCESS_SECRET,
    });
  }

  async validate(payload: { sub: string; jti: string }) {
    const isRevoked = await this.redis.get(
      AuthRedis.BlackListJti.KEY(payload.jti),
    );
    if (isRevoked === AuthRedis.BlackListJti.VALUE) {
      console.log(isRevoked);
      throw new UnauthorizedException({
        message: AuthMessage.Error.TOKEN_REVOKED,
        code: ErrorCode.ACCESS_TOKEN_REVOKED,
      });
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException({
        message: AuthMessage.Error.INVALID_USER,
        code: ErrorCode.INVALID_USER,
      });
    }

    return user;
  }
}
