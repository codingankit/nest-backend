import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { ValidationMessage } from '@/common';

export const SigninSchema = z
  .object({
    email: z
      .string({
        required_error: ValidationMessage.EMAIL_REQUIRED,
        invalid_type_error: ValidationMessage.EMAIL_STRING,
      })
      .trim()
      .email(ValidationMessage.EMAIL_INVALID),

    password: z
      .string({
        required_error: ValidationMessage.PASSWORD_REQUIRED,
        invalid_type_error: ValidationMessage.PASSWORD_STRING,
      })
      .trim()
      .min(4, ValidationMessage.PASSWORD_LENGTH)
      .max(50, ValidationMessage.PASSWORD_LENGTH),
  })
  .strict({
    message: ValidationMessage.UNKNOWN_PAYLOAD_KEYS,
  });

export class SigninDto extends createZodDto(SigninSchema) {}
