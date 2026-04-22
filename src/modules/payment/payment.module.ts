import { forwardRef, Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { OrderService } from '../order/order.service';
import { OrdersModule } from '../order/order.module';

@Module({
  imports: [forwardRef(() => OrdersModule)],
  providers: [PaymentService],
  controllers: [PaymentController],
  exports: [PaymentService],
})
export class PaymentModule {}
