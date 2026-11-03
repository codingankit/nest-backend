import { applyDecorators, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtGuard, RolesGuard } from '@/common/guards';
import { Roles } from '../base';

export const Admin = () => {
  return applyDecorators(UseGuards(JwtGuard, RolesGuard), Roles(Role.ADMIN));
};
