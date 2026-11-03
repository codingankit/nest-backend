export const PrismaError = {
  UNIQUE_CONSTRAINT: 'P2002',
  RECORD_NOT_FOUND: 'P2025',
} as const;

export type PrismaError = (typeof PrismaError)[keyof typeof PrismaError];
