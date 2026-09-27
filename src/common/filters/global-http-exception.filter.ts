import {
  Catch,
  ExceptionFilter,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorCode, HttpMessage, JwtError } from '@/common/constants';

@Catch(HttpException)
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception.getStatus();
    const originalResponse = exception.getResponse();

    const responseBody: Record<string, any> =
      typeof originalResponse === 'string'
        ? { message: originalResponse }
        : (originalResponse as Record<string, any>);

    let message = responseBody.message ?? HttpMessage.Error.Message.GENERIC;

    // Centralized error type mapping
    const errorTypeMap: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: HttpMessage.Error.Type.BAD_REQUEST,
      [HttpStatus.UNAUTHORIZED]: HttpMessage.Error.Type.UNAUTHORIZED,
      [HttpStatus.FORBIDDEN]: HttpMessage.Error.Type.FORBIDDEN,
      [HttpStatus.NOT_FOUND]: HttpMessage.Error.Type.NOT_FOUND,
      [HttpStatus.CONFLICT]: HttpMessage.Error.Type.CONFLICT,
      [HttpStatus.UNPROCESSABLE_ENTITY]:
        HttpMessage.Error.Type.UNPROCESSABLE_ENTITY,
      [HttpStatus.TOO_MANY_REQUESTS]: HttpMessage.Error.Type.TOO_MANY_REQUESTS,
      [HttpStatus.INTERNAL_SERVER_ERROR]:
        HttpMessage.Error.Type.INTERNAL_SERVER_ERROR,
      [HttpStatus.SERVICE_UNAVAILABLE]:
        HttpMessage.Error.Type.SERVICE_UNAVAILABLE,
      [HttpStatus.BAD_GATEWAY]: HttpMessage.Error.Type.BAD_GATEWAY,
      [HttpStatus.GATEWAY_TIMEOUT]: HttpMessage.Error.Type.GATEWAY_TIMEOUT,
    };

    const error =
      responseBody.error ??
      errorTypeMap[status] ??
      HttpMessage.Error.Type.GENERIC;

    let code = responseBody.code;

    // Check for JWT errors via message (re-thrown as UnauthorizedException)
    // Only if code hasn't been set yet
    if (!code && typeof message === 'string') {
      if (message === JwtError.Msg.TOKEN_EXPIRED) {
        code = ErrorCode.ACCESS_TOKEN_EXPIRED;
      } else if (
        message === JwtError.Msg.TOKEN_INVALID ||
        message === JwtError.Msg.TOKEN_MISSING
      ) {
        code = ErrorCode.ACCESS_TOKEN_INVALID;
      }
    }

    // Detect Zod-style validation errors and reshape them
    let details: Record<string, string> | undefined;

    if (
      exception instanceof BadRequestException &&
      Array.isArray(responseBody.message)
    ) {
      const formattedErrors: Record<string, string> = {};

      for (const msg of responseBody.message) {
        const [key, value] = msg.split(':').map((s: any) => s.trim());
        if (key && value) {
          formattedErrors[key] = value;
        } else {
          const cleaned = msg.replace(/^[:\s]+/, '').trim();
          formattedErrors.error = cleaned;
        }
      }

      details = formattedErrors;
      message = HttpMessage.Error.Message.INVALID_PAYLOAD;
      code ??= ErrorCode.INVALID_PAYLOAD;
    }

    // Handle rate limiting
    const retryAfterHeader =
      typeof (response as any).getHeader === 'function'
        ? (response as any).getHeader('Retry-After')
        : undefined;
    const retryAfter = retryAfterHeader ? Number(retryAfterHeader) : undefined;

    const jsonResponse: Record<string, any> = {
      success: false,
      statusCode: status,
      path: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
      message,
      error,
    };

    if (code) jsonResponse.code = code;
    if (details) jsonResponse.details = details;
    if (
      status === HttpStatus.TOO_MANY_REQUESTS &&
      typeof retryAfter === 'number'
    )
      jsonResponse.retryAfter = retryAfter;

    response.status(status).json(jsonResponse);
  }
}
