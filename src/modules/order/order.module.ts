import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './domain/order.entity';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [TypeOrmModule.forFeature([Order]), forwardRef(() => PaymentModule)],
  providers: [OrderService],
  controllers: [OrderController],
  exports: [TypeOrmModule, OrderService],
})
export class OrdersModule {}
