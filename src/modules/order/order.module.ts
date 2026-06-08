import { forwardRef, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IdempotencyInterceptor } from 'src/common/interceptors/idempotency.interceptor';
import { PaymentModule } from '../payment/payment.module';
import { IdempotencyKey } from './domain/idempotency-key.entity';
import { Order } from './domain/order.entity';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, IdempotencyKey]),
    forwardRef(() => PaymentModule),
  ],
  providers: [
    OrderService,
    {
      provide: APP_INTERCEPTOR,
      useClass: IdempotencyInterceptor,
    },
  ],
  controllers: [OrderController],
  exports: [TypeOrmModule, OrderService],
})
export class OrdersModule {}
