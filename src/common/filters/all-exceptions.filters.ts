/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { QueryFailedError } from 'typeorm';

const STATUS_NAMES: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'Bad Request',
  [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
  [HttpStatus.FORBIDDEN]: 'Forbidden',
  [HttpStatus.NOT_FOUND]: 'Not Found',
  [HttpStatus.CONFLICT]: 'Conflict',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: any, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal Server Error';

    if (exception instanceof HttpException) {
      httpStatus = exception.getStatus();
      const response = exception.getResponse();
      message =
        typeof response === 'string'
          ? response
          : (response as any).message || message;

      if (httpStatus >= 500) {
        this.logger.error(`HttpException: ${httpStatus} - ${message}`);
      } else {
        this.logger.warn(`HttpException: ${httpStatus} - ${message}`);
      }
    } else if (exception instanceof QueryFailedError) {
      const mapped = this.mapQueryFailedError(exception);
      httpStatus = mapped.status;
      message = mapped.message;
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(
        `Unhandled error: ${exception.message}`,
        exception.stack,
      );
    }

    const responseBody = {
      statusCode: httpStatus,
      message,
      error: STATUS_NAMES[httpStatus] || 'Internal Server Error',
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }

  private mapQueryFailedError(error: QueryFailedError): {
    status: number;
    message: string;
  } {
    const driverError = error.driverError as { code?: string; detail?: string };

    this.logger.warn(
      `QueryFailedError: ${driverError.code} - ${error.message}`,
    );

    switch (driverError.code) {
      case '23505':
        return { status: HttpStatus.CONFLICT, message: 'Duplicate entry' };
      case '23503':
        return {
          status: HttpStatus.CONFLICT,
          message: 'Referenced record not found',
        };
      case '23502':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Missing required field',
        };
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Database error',
        };
    }
  }
}
