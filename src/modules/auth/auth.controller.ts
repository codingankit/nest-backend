import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { Auth, AuthUser, createCsrfUtil, GetUser, TokenKey } from '@/common';
import { ConfigService } from '@/config';
import { AuthService } from './auth.service';
import {
  AuthRoute,
  AuthQuery,
  AuthMessage,
  Cookie,
  AuthRedirectQuery,
} from './constants';
import { RequestWithCookies } from './types';
import { SigninDto, SignupDto } from './dto';
import { CsrfGuard } from './guards';

@Controller(AuthRoute.BASE)
@Throttle({ default: { limit: 10, ttl: 60000 } })
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post(AuthRoute.SIGNUP)
  @Throttle({ default: { limit: 5, ttl: 60000, blockDuration: 300000 } })
  signup(@Body() dto: SignupDto) {
    return this.auth.signup(dto);
  }

  @Get(AuthRoute.VERIFY_EMAIL)
  @Throttle({ default: { limit: 5, ttl: 600000 } })
  async verifyEmail(
    @Query(AuthQuery.TOKEN) token: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const CLIENT_URL = this.config.CLIENT_URL;

    if (!token) {
      throw new BadRequestException(AuthMessage.Error.TOKEN_MISSING);
    }

    const { refreshToken } = await this.auth.verifyEmail(token);

    res.cookie(
      Cookie.RefreshToken.KEY,
      refreshToken,
      Cookie.RefreshToken.OPTIONS,
    );

    res.redirect(`${CLIENT_URL}${AuthRedirectQuery.VERIFIED}`);
  }

  @Post(AuthRoute.SIGNIN)
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  async signin(
    @Body() dto: SigninDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const signinRes = await this.auth.signin(dto);

    if (!signinRes.requires2FA) {
      const { accessToken, refreshToken } = signinRes;

      res.cookie(
        Cookie.RefreshToken.KEY,
        refreshToken,
        Cookie.RefreshToken.OPTIONS,
      );

      return {
        message: AuthMessage.Success.SIGNIN_OK,
        requires2FA: false,
        accessToken,
      };
    }

    res.status(HttpStatus.ACCEPTED);
    return signinRes;
  }

  @Post(AuthRoute.SIGNOUT)
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Auth()
  async signout(
    @Req() req: RequestWithCookies,
    @Res({ passthrough: true }) res: Response,
    @GetUser() user: AuthUser,
  ) {
    return this.auth.signout(req, res, user);
  }

  @Get(AuthRoute.VERIFY_2FA)
  @Throttle({ default: { limit: 5, ttl: 600000, blockDuration: 300000 } })
  async verify2FA(
    @Query(AuthQuery.TOKEN) token: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const CLIENT_URL = this.config.CLIENT_URL;

    if (!token) {
      throw new BadRequestException(AuthMessage.Error.TOKEN_MISSING);
    }

    const { refreshToken } = await this.auth.verify2FA(token);

    res.cookie(
      Cookie.RefreshToken.KEY,
      refreshToken,
      Cookie.RefreshToken.OPTIONS,
    );

    res.redirect(`${CLIENT_URL}${AuthRedirectQuery.VERIFIED}`);
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(CsrfGuard)
  @Post(AuthRoute.REFRESH)
  @Throttle({ default: { limit: 30, ttl: 600000, blockDuration: 120000 } })
  async refreshAccess(
    @Req() req: RequestWithCookies,
    @Res({ passthrough: true }) res: Response,
  ) {
    const oldRefreshToken = req.cookies?.[Cookie.RefreshToken.KEY];

    if (!oldRefreshToken) {
      throw new BadRequestException(AuthMessage.Error.REFRESH_MISSING);
    }

    const { accessToken, refreshToken } =
      await this.auth.refreshAccess(oldRefreshToken);

    res.cookie(
      Cookie.RefreshToken.KEY,
      refreshToken,
      Cookie.RefreshToken.OPTIONS,
    );

    return {
      message: AuthMessage.Success.REFRESH_OK,
      accessToken,
    };
  }

  @Get(AuthRoute.CSRF)
  @SkipThrottle({ default: true })
  getCsrfToken(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies[TokenKey.REFRESH];
    if (!refreshToken) {
      throw new UnauthorizedException(AuthMessage.Error.REFRESH_MISSING);
    }
    const { generateCsrfToken } = createCsrfUtil(this.config);
    const token = generateCsrfToken(req, res);
    return { message: AuthMessage.Success.CSRF_GENERATED, token };
  }
}
