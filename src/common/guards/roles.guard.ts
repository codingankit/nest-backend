import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { HttpMessage, MetaDataKey } from '@/common/constants';
import { AuthUser } from '@/common/types';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<Request & { user: AuthUser }>();

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      MetaDataKey.ROLES,
      [ctx.getHandler(), ctx.getClass()],
    );
    if (!requiredRoles) return true;

    const user = req.user;
    if (
      !user ||
      !user.role ||
      !requiredRoles.some((role) => user.role.includes(role))
    ) {
      throw new ForbiddenException(HttpMessage.Error.Message.FORBIDDEN);
    }

    return true;
  }
}
