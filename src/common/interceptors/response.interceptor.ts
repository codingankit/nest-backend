import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpMessage } from '@/common/constants';

export interface BaseResponse<T = unknown> {
  statusCode: number;
  success: true;
  message: string;
  data?: T;
}

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, BaseResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<BaseResponse<T>> {
    const res = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((original: unknown): BaseResponse<T> => {
        const base: BaseResponse<T> = {
          statusCode: res.statusCode,
          success: true,
          message: HttpMessage.Success.GENERIC,
        };

        if (
          original &&
          typeof original === 'object' &&
          !Array.isArray(original)
        ) {
          const { message, data, ...rest } = original as Record<
            string,
            unknown
          >;

          if (typeof message === 'string') {
            base.message = message;
          }

          if (data !== undefined) {
            base.data = {
              ...(data as Record<string, unknown>),
              ...rest, // Merge extra fields into data
            } as T;
          } else if (Object.keys(rest).length > 0) {
            base.data = rest as T;
          }

          return base;
        }

        // Primitive or array → assign directly as data
        base.data = original as T;
        return base;
      }),
    );
  }
}
