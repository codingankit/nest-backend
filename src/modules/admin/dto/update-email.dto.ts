import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { ValidationMessage } from '@/common';

export const updateEmailSchema = z
  .object({
    email: z
      .string({
        required_error: ValidationMessage.EMAIL_REQUIRED,
        invalid_type_error: ValidationMessage.EMAIL_STRING,
      })
      .trim()
      .email({ message: ValidationMessage.EMAIL_INVALID }),
  })
  .strict({
    message: ValidationMessage.UNKNOWN_PAYLOAD_KEYS,
  });

export class UpdateEmailDto extends createZodDto(updateEmailSchema) {}
