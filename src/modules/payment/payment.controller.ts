import {
  BadRequestException,
  Controller,
  Headers,
  InternalServerErrorException,
  Post,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { OrderService } from '../order/order.service';
import { Stripe } from 'stripe';

type RequesrRaw = RawBodyRequest<Request>;

@Controller('payment')
export class PaymentController {
  constructor(
    private readonly paymentsService: PaymentService,
    private readonly orderService: OrderService,
  ) {}

  @Post('webhook')
  async habdlewebhook(
    @Req() req: RequesrRaw,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!signature)
      throw new InternalServerErrorException('Stripe signature is missing');

    let event: Stripe.Event;

    try {
      event = this.paymentsService.constructEvent(req.rawBody!, signature);
    } catch (error) {
      throw new BadRequestException(`webhook Error ${error}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const orderID = session.metadata?.orderId;
      await this.orderService.markAsPaid(orderID!);
    }

    return { recieved: true };
  }
}
