import { Request } from 'express';

export interface RequestWithCookies extends Request {
  cookies: {
    refresh_token: string;
  };
}

export interface JwtPayload {
  sub: string;
  jti: string;
  exp: number;
}

export interface RedisDataForVerification {
  id: string;
  email: string;
}
