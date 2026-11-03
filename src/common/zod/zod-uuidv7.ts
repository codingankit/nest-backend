import { z } from 'zod';
import { validate as uuidValidate, version as uuidVersion } from 'uuid';

export const zUUIDv7 = (message: string) =>
  z.string().refine((val) => uuidValidate(val) && uuidVersion(val) === 7, {
    message,
  });
