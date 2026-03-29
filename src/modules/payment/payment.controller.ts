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

/**
 * Helper type for requests with raw body (unparsed).
 * Required for Stripe webhook signature verification.
 */
type RequesrRaw = RawBodyRequest<Request>;

/**
 * Controller responsible for handling payment operations,
 * including receiving Stripe webhooks.
 */
@Controller('payment')
export class PaymentController {
  /**
   * @param paymentsService - Service for Stripe-related operations
   * @param orderService - Service for managing order lifecycle
   */
  constructor(
    private readonly paymentsService: PaymentService,
    private readonly orderService: OrderService,
  ) {}

  /**
   * Endpoint to receive Stripe webhooks.
   *
   * @remarks
   * Verifies the webhook signature to ensure the event comes from Stripe.
   * Currently only processes the 'checkout.session.completed' event to mark
   * orders as paid.
   *
   * @param req - Request with raw body (unparsed) for signature verification
   * @param signature - Webhook signature provided in the 'stripe-signature' header
   * @returns Confirmation of event receipt
   * @throws {InternalServerErrorException} If the webhook signature is missing
   * @throws {BadRequestException} If the signature is invalid or the event cannot be processed
   * @throws {InternalServerErrorException} If the order id is missing
   */
  @Post('webhook')
  async handleWebhook(
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

      if (orderID) {
        await this.orderService.markAsPaid(orderID);
      } else new InternalServerErrorException(`Error order id: ${orderID}`);
    }

    return { recieved: true };
  }
}
