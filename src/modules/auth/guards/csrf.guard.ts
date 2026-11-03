import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@/config';
import { createCsrfUtil } from '@/common';
import { AuthMessage } from '../constants';

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = context.switchToHttp();
    const req: Request = ctx.getRequest();
    const res: Response = ctx.getResponse();
    const { doubleCsrfProtection } = createCsrfUtil(this.config);

    await new Promise<void>((resolve, reject) => {
      doubleCsrfProtection(req, res, (err?: unknown) => {
        if (err)
          return reject(new ForbiddenException(this.getErrorMessage(err)));
        resolve();
      });
    });

    return true;
  }

  private getErrorMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (typeof err === 'string') return err;
    try {
      return JSON.stringify(err);
    } catch {
      return AuthMessage.Error.UNKNOWN_CSRF;
    }
  }
}
