import { SetMetadata } from '@nestjs/common';
import { MetaDataKey } from '@/common/constants';

export const Roles = (...roles: string[]) =>
  SetMetadata(MetaDataKey.ROLES, roles);
