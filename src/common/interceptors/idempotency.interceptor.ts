import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request, Response } from 'express';
import { Observable, of, switchMap } from 'rxjs';
import { IdempotencyKey } from 'src/modules/order/domain/idempotency-key.entity';
import { Repository } from 'typeorm';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly logger = new Logger(IdempotencyInterceptor.name);

  constructor(
    @InjectRepository(IdempotencyKey)
    private readonly repo: Repository<IdempotencyKey>,
  ) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<Request>();
    const key = request.headers['idempotency-key'] as string;

    if (request.method !== 'POST' || !key) {
      return next.handle();
    }

    return this.handleIdempotency(key, context, next);
  }

  private async handleIdempotency(
    key: string,
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Promise<Observable<any>> {
    const existing = await this.repo.findOne({ where: { key } });

    if (existing) {
      this.logger.log(`IdempotencyKey reused: ${key}`);
      const response = context.switchToHttp().getResponse<Response>();
      response.status(existing.statusCode);
      return of(JSON.parse(existing.response));
    }

    return next.handle().pipe(
      switchMap(async (data) => {
        const res = context.switchToHttp().getResponse<Response>();
        const statusCode = res.statusCode;

        await this.repo.save({
          key,
          response: JSON.stringify(data),
          statusCode,
        });
      }),
    );
  }
}
