import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { Gender } from '@prisma/client';
import { ValidationMessage } from '@/common';
import { AdminMessage } from '../constants';

export const updateProfileSchema = z
  .object({
    name: z
      .string({
        invalid_type_error: ValidationMessage.NAME_STRING,
      })
      .trim()
      .min(2, { message: ValidationMessage.NAME_LENGTH })
      .max(100, { message: ValidationMessage.NAME_LENGTH })
      .regex(/^[A-Za-z\s'-]+$/, { message: ValidationMessage.NAME_INVALID })
      .optional(),

    gender: z
      .string({
        invalid_type_error: ValidationMessage.GENDER_STRING,
      })
      .transform((val) => val?.toUpperCase())
      .refine((val) => !val || Object.values(Gender).includes(val as Gender), {
        message: ValidationMessage.GENDER_INVALID,
      })
      .transform((val) => (val ? (val as Gender) : undefined))
      .optional(),
  })
  .strict()
  // 👇 Ensure at least one field is present
  .superRefine((data, ctx) => {
    if (!data.name && !data.gender) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: AdminMessage.Validation.AT_LEAST_ONE,
      });
    }
  });

export class UpdateProfileDto extends createZodDto(updateProfileSchema) {}
