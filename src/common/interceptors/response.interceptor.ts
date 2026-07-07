import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, type Observable } from 'rxjs';
import type { ApiResponse } from '../interfaces/api-response.interface';

/**
 * Global response interceptor. Wraps every controller return value in the
 * standard success envelope: `{ success, statusCode, timestamp, data }`.
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T>> {
    const statusCode = context.switchToHttp().getResponse().statusCode;

    return next.handle().pipe(
      map((data) => ({
        success: true as const,
        statusCode,
        timestamp: new Date().toISOString(),
        data,
      })),
    );
  }
}
