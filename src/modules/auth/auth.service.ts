import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { Response } from 'express';
import { TwoFAMethod, Prisma } from '@prisma/client';
import * as argon from 'argon2';
import { randomBytes } from 'crypto';
import type { StringValue } from 'ms';
import { uuidv7 } from 'uuidv7';
import { ConfigService } from '@/config';
import { PrismaService } from '@/infra/prisma';
import { EmailService } from '@/infra/email';
import {
  AuthUser,
  DEFAULT_FROM_EMAIL,
  ErrorCode,
  JwtError,
  PrismaError,
} from '@/common';
import { CacheService } from '@/cache';
import { SigninDto, SignupDto } from './dto';
import {
  AuthMessage,
  AuthRedis,
  AuthURL,
  Cookie,
  CryptoToken,
  TokenType,
} from './constants';
import {
  JwtPayload,
  RedisDataForVerification,
  RequestWithCookies,
} from './types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly cache: CacheService,
    private readonly email: EmailService,
  ) {}

  async signup(dto: SignupDto) {
    const { name, email, password, gender } = dto;
    const hash = await argon.hash(password);

    try {
      const user = await this.prisma.user.create({
        data: {
          name,
          email,
          hash,
          gender,
        },
      });

      const token = randomBytes(CryptoToken.LENGTH).toString(
        CryptoToken.ENCODING,
      );

      await this.cache.setEmailVerification(token, { id: user.id, email });

      const verificationLink = `${this.config.CLIENT_URL}${AuthURL.VERIFY_EMAIL(token)}`;

      const emailRes = await this.email.send({
        from: DEFAULT_FROM_EMAIL,
        to: email,
        subject: 'Verify your email address',
        html: `
              <p>Hello ${name},</p>
              <p>Thanks for signing up. Please verify your email by clicking the link below:</p>
              <a href="${verificationLink}">Verify Email</a>
              <p>This link will expire in 5 minutes.</p>

             `,
      });

      if (emailRes.success) {
        return {
          message: AuthMessage.Success.VERIFY_EMAIL_SENT,
          email,
          expiresIn: AuthRedis.EmailVerification.TTL,
        };
      } else {
        throw new InternalServerErrorException({
          message: AuthMessage.Error.VERIFY_EMAIL_FAILED,
          code: ErrorCode.VERIFY_EMAIL_FAILED,
        });
      }
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === PrismaError.UNIQUE_CONSTRAINT) {
          throw new ConflictException({
            message: AuthMessage.Error.EMAIL_ALREADY_REGISTERED,
            code: ErrorCode.EMAIL_REGED,
          });
        }
      }
      throw error;
    }
  }

  async verifyEmail(token: string) {
    const data =
      await this.cache.getEmailVerification<RedisDataForVerification>(token);
    if (!data)
      throw new UnprocessableEntityException({
        message: AuthMessage.Error.TOKEN_EXP_OR_USED,
        code: ErrorCode.TOKEN_EXP_OR_USED,
      });

    const { id, email } = data;

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user)
      throw new NotFoundException({
        message: AuthMessage.Error.INVALID_USER,
        code: ErrorCode.INVALID_USER,
      });

    if (user.email !== email) {
      throw new ForbiddenException({
        message: AuthMessage.Error.INVALID_TOKEN,
        code: ErrorCode.INVALID_TOKEN,
      });
    }

    await this.prisma.user.update({
      where: { id },
      data: { isVerified: true },
    });

    await this.cache.delEmailVerification(token);

    const refreshToken = await this.signToken(id, TokenType.REFRESH);

    const hashedRefreshToken = await argon.hash(refreshToken);

    await this.prisma.user.update({
      where: { id },
      data: { hashedRefreshToken },
    });

    return {
      refreshToken,
    };
  }

  async signin(dto: SigninDto) {
    const { email, password } = dto;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException({
        message: AuthMessage.Error.EMAIL_NOT_REGISTERED,
        code: ErrorCode.EMAIL_NOT_REGED,
      });
    }

    if (!user.isVerified) {
      throw new ForbiddenException({
        message: AuthMessage.Error.EMAIL_NOT_VERIFIED,
        code: ErrorCode.EMAIL_NOT_VERIFIED,
      });
    }

    if (!(await argon.verify(user.hash, password))) {
      throw new UnauthorizedException({
        message: AuthMessage.Error.WRONG_PASS,
        code: ErrorCode.WRONG_PASS,
      });
    }

    if (user.is2FAEnabled) {
      if (user.twoFAMethod === TwoFAMethod.EMAIL) {
        const token = randomBytes(CryptoToken.LENGTH).toString(
          CryptoToken.ENCODING,
        );

        await this.cache.set2FAVerification(token, { id: user.id, email });

        const verificationLink = `${this.config.CLIENT_URL}${AuthURL.VERIFY_2FA(token)}`;

        const emailRes = await this.email.send({
          from: DEFAULT_FROM_EMAIL,
          to: email,
          subject: 'Complete Your Login with 2FA',
          html: `
                 <p>Hello ${user.name},</p>
                 <p>We detected a login attempt to your account. To continue, please verify your identity by clicking the link below:</p>
                 <a href="${verificationLink}">Verify 2FA Login</a>
                 <p>This link is valid for 5 minutes. If you didn’t attempt to login, please ignore this email.</p>
                `,
        });

        if (emailRes.success) {
          return {
            message: AuthMessage.Success.TFA_EMAIL_SENT,
            requires2FA: true,
            type: TwoFAMethod.EMAIL,
            email,
            expiresIn: AuthRedis.EmailVerification.TTL,
          };
        } else {
          throw new InternalServerErrorException({
            message: AuthMessage.Error.TFA_EMAIL_FAILED,
            code: ErrorCode.TFA_EMAIL_FAILED,
          });
        }
      }
      if (user.twoFAMethod === TwoFAMethod.TOTP) {
        return {
          message: AuthMessage.Success.TOTP_REQUIRED,
          requires2FA: true,
          type: TwoFAMethod.TOTP,
        };
      }
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.signToken(user.id, TokenType.ACCESS),
      this.signToken(user.id, TokenType.REFRESH),
    ]);

    const hashedRefreshToken = await argon.hash(refreshToken);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { hashedRefreshToken },
    });

    return { requires2FA: false, accessToken, refreshToken };
  }

  async signout(req: RequestWithCookies, res: Response, user: AuthUser) {
    const token = req.headers.authorization?.replace(/^Bearer\s+/, '');
    if (!token)
      throw new UnauthorizedException({
        message: JwtError.Msg.TOKEN_MISSING,
        code: ErrorCode.TOKEN_MISSING,
      });

    const payload = this.jwt.verify(token, {
      secret: this.config.JWT_ACCESS_SECRET,
    }) as JwtPayload;

    if (payload.jti && payload.exp) {
      const ttl = payload.exp - Math.floor(Date.now() / 1000);
      await this.cache.blacklistJti(payload.jti, ttl);
    }

    if (user.id) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { hashedRefreshToken: null },
      });
    }

    res.clearCookie(Cookie.RefreshToken.KEY, Cookie.RefreshToken.OPTIONS);

    return { message: AuthMessage.Success.SIGNOUT_OK };
  }

  async verify2FA(token: string) {
    const data =
      await this.cache.get2FAVerification<RedisDataForVerification>(token);

    if (!data)
      throw new UnprocessableEntityException({
        message: AuthMessage.Error.TOKEN_EXP_OR_USED,
        code: ErrorCode.TOKEN_EXP_OR_USED,
      });

    const { id, email } = data;

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user)
      throw new NotFoundException({
        message: AuthMessage.Error.INVALID_USER,
        code: ErrorCode.INVALID_USER,
      });

    if (user.email !== email)
      throw new ForbiddenException({
        message: AuthMessage.Error.INVALID_TOKEN,
        code: ErrorCode.INVALID_TOKEN,
      });

    await this.cache.del2FAVerification(token);

    const refreshToken = await this.signToken(id, TokenType.REFRESH);

    const hashedRefreshToken = await argon.hash(refreshToken);

    await this.prisma.user.update({
      where: { id },
      data: { hashedRefreshToken },
    });

    return { refreshToken };
  }

  async refreshAccess(oldRefreshToken: string) {
    try {
      const { sub } = this.jwt.verify<JwtPayload>(oldRefreshToken, {
        secret: this.config.JWT_REFRESH_SECRET,
      });

      const user = await this.prisma.user.findUnique({
        where: { id: sub },
        select: { id: true, hashedRefreshToken: true },
      });

      if (!user || !user.hashedRefreshToken) {
        throw new UnauthorizedException({
          message: AuthMessage.Error.NO_REFRESH_USER,
          code: ErrorCode.NO_REFRESH_USER,
        });
      }

      const isRefreshTokenMatched = await argon.verify(
        user.hashedRefreshToken,
        oldRefreshToken,
      );
      if (!isRefreshTokenMatched) {
        throw new UnauthorizedException({
          message: AuthMessage.Error.INVALID_REFRESH,
          code: ErrorCode.INVALID_REFRESH,
        });
      }

      const [accessToken, newRefreshToken] = await Promise.all([
        this.signToken(user.id, TokenType.ACCESS),
        this.signToken(user.id, TokenType.REFRESH),
      ]);

      const hashedNewRefreshToken = await argon.hash(newRefreshToken);

      await this.prisma.user.update({
        where: { id: user.id },
        data: { hashedRefreshToken: hashedNewRefreshToken },
      });

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch (err) {
      console.error(err);
      throw new UnauthorizedException({
        message: AuthMessage.Error.REFRESH_EXPIRED,
        code: ErrorCode.REFRESH_EXPIRED,
      });
    }
  }

  async signToken(id: string, tokenType: TokenType): Promise<string> {
    const payload: { sub: string } = { sub: id };

    const accessSecret = this.config.JWT_ACCESS_SECRET;
    const refreshSecret = this.config.JWT_REFRESH_SECRET;

    const accessExpiresIn = this.config.JWT_ACCESS_EXPIRES_IN;
    const refreshExpiresIn = this.config.JWT_REFRESH_EXPIRES_IN;

    if (tokenType === TokenType.ACCESS) {
      const options: JwtSignOptions = {
        expiresIn: accessExpiresIn as StringValue,
        secret: accessSecret,
        jwtid: uuidv7(),
      };
      return await this.jwt.signAsync(payload, options);
    }

    if (tokenType === TokenType.REFRESH) {
      const options: JwtSignOptions = {
        expiresIn: refreshExpiresIn as StringValue,
        secret: refreshSecret,
      };
      return await this.jwt.signAsync(payload, options);
    }

    throw new Error(AuthMessage.Error.INVALID_TOKEN_TYPE);
  }
}
