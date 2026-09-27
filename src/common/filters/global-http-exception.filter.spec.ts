import { HttpException, HttpStatus, BadRequestException } from '@nestjs/common';
import { ArgumentsHost } from '@nestjs/common/interfaces';
import { GlobalHttpExceptionFilter } from './global-http-exception.filter';
import { HttpMessage } from '@/common/constants';

describe('GlobalHttpExceptionFilter', () => {
  let filter: GlobalHttpExceptionFilter;
  let mockResponse: any;
  let mockRequest: any;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new GlobalHttpExceptionFilter();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      getHeader: jest.fn(),
    };

    mockRequest = { url: '/test/url', method: 'GET' };

    mockHost = {
      switchToHttp: jest.fn(() => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      })),
    } as unknown as ArgumentsHost;
  });

  it('should handle a generic HttpException', () => {
    const exception = new HttpException(
      'Something went wrong',
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Something went wrong',
        error: HttpMessage.Error.Type.BAD_REQUEST,
      }),
    );
  });

  it('should handle UNAUTHORIZED with proper error type', () => {
    const exception = new HttpException(
      { message: 'Unauthorized access' },
      HttpStatus.UNAUTHORIZED,
    );

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Unauthorized access',
        error: HttpMessage.Error.Type.UNAUTHORIZED,
      }),
    );
  });

  it('should handle Zod-style BadRequestException with array of messages', () => {
    const messages = [
      'email: Invalid email format',
      ': Unrecognized key(s) in object: age',
    ];
    const exception = new BadRequestException({ message: messages });

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: HttpMessage.Error.Message.INVALID_PAYLOAD,
        details: {
          email: 'Invalid email format',
          error: 'Unrecognized key(s) in object: age',
        },
      }),
    );
  });

  it('should handle TOO_MANY_REQUESTS and include retryAfter', () => {
    mockResponse.getHeader = jest.fn(() => '60');
    const exception = new HttpException(
      'Rate limit exceeded',
      HttpStatus.TOO_MANY_REQUESTS,
    );

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpStatus.TOO_MANY_REQUESTS,
    );
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        error: HttpMessage.Error.Type.TOO_MANY_REQUESTS,
        retryAfter: 60,
      }),
    );
  });

  it('should include code if present in responseBody', () => {
    const exception = new HttpException(
      { message: 'Invalid token', code: 'AUTH_INVALID_TOKEN' },
      HttpStatus.UNAUTHORIZED,
    );

    filter.catch(exception, mockHost);

    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'AUTH_INVALID_TOKEN',
        message: 'Invalid token',
      }),
    );
  });
});
