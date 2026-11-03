import { ExecutionContext, CallHandler } from '@nestjs/common';
import { ArgumentsHost } from '@nestjs/common/interfaces';
import { of } from 'rxjs';
import { HttpMessage } from '@/common/constants';
import { ResponseInterceptor, BaseResponse } from './response.interceptor';

describe('ResponseInterceptor', () => {
  let interceptor: ResponseInterceptor<any>;
  let mockCallHandler: Partial<CallHandler<any>>;
  let mockContext: Partial<ExecutionContext>;
  let mockResponse: any;

  beforeEach(() => {
    interceptor = new ResponseInterceptor();
    mockResponse = { statusCode: 200 };

    mockContext = {
      switchToHttp: jest.fn(() => ({
        getRequest: jest.fn().mockReturnValue({ url: '/test', method: 'GET' }),
        getResponse: jest.fn().mockReturnValue(mockResponse),
      })),
    } as unknown as ArgumentsHost;
    mockCallHandler = { handle: jest.fn() };
  });

  it('should wrap primitive/array responses correctly', (done) => {
    (mockCallHandler.handle as jest.Mock).mockReturnValue(of([1, 2, 3]));

    interceptor
      .intercept(mockContext as any, mockCallHandler as CallHandler<any>)
      .subscribe((result: BaseResponse<any>) => {
        expect(result).toEqual({
          statusCode: 200,
          success: true,
          message: HttpMessage.Success.GENERIC,
          data: [1, 2, 3],
        });
        done();
      });
  });

  it('should wrap object responses with message/data merge', (done) => {
    const original = {
      message: 'Custom',
      data: { foo: 'bar' },
      extra: 'field',
    };
    (mockCallHandler.handle as jest.Mock).mockReturnValue(of(original));

    interceptor
      .intercept(mockContext as any, mockCallHandler as CallHandler<any>)
      .subscribe((result: BaseResponse<any>) => {
        expect(result).toEqual({
          statusCode: 200,
          success: true,
          message: 'Custom',
          data: { foo: 'bar', extra: 'field' },
        });
        done();
      });
  });
});
