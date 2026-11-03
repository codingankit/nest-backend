import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { Gender } from '@prisma/client';
import { ValidationMessage } from '@/common';

export const signupSchema = z
  .object({
    name: z
      .string({
        required_error: ValidationMessage.NAME_REQUIRED,
        invalid_type_error: ValidationMessage.NAME_STRING,
      })
      .trim()
      .min(2, { message: ValidationMessage.NAME_LENGTH })
      .max(100, { message: ValidationMessage.NAME_LENGTH })
      .regex(/^[A-Za-z\s'-]+$/, {
        message: ValidationMessage.NAME_INVALID,
      }),

    email: z
      .string({
        required_error: ValidationMessage.EMAIL_REQUIRED,
        invalid_type_error: ValidationMessage.EMAIL_STRING,
      })
      .trim()
      .email({ message: ValidationMessage.EMAIL_INVALID }),

    gender: z
      .string()
      .transform((val) => val.toUpperCase())
      .refine((val) => Object.values(Gender).includes(val as Gender), {
        message: ValidationMessage.GENDER_INVALID,
      })
      .transform((val) => val as Gender),

    password: z
      .string({
        required_error: ValidationMessage.PASSWORD_REQUIRED,
        invalid_type_error: ValidationMessage.PASSWORD_STRING,
      })
      .trim()
      .min(4, { message: ValidationMessage.PASSWORD_LENGTH })
      .max(50, { message: ValidationMessage.PASSWORD_LENGTH }),
  })
  .strict({
    message: ValidationMessage.UNKNOWN_PAYLOAD_KEYS,
  });
export class SignupDto extends createZodDto(signupSchema) {}
