import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUser } from '@/common/types';

export const GetUser = createParamDecorator((data, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<Request & { user: AuthUser }>();
  const user = request.user;
  return data ? user[data] : user;
});
