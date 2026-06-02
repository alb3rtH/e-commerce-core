/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse<Response>();
          this.logger.log(`${method} ${url} ${response.statusCode}`);
        },
        error: (error: Error) => {
          const statusCode =
            error instanceof HttpException ? error.getStatus() : 500;
          this.logger.error(
            `${method} ${url} ${statusCode} - ${error.message}`,
          );
        },
      }),
    );
  }
}
