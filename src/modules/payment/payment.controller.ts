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
import {
  ApiBody,
  ApiConsumes,
  ApiHeader,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

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
  @ApiOperation({ summary: 'enpoint to manage webhook from stripe' })
  @ApiOperation({
    summary: 'Endpoint to manage webhooks from Stripe',
    description: `Receives webhook events from Stripe. 
    Verifies the signature to ensure authenticity. 
    Processes 'checkout.session.completed' events to mark orders as paid.`,
  })
  @ApiHeader({
    name: 'stripe-signature',
    description: 'Stripe webhook signature for verification',
    required: true,
    example:
      't=1492774577,v1=5257a869e7ecebeda32affa62cdca3fa51cad7e77a0e56ff536d0ce8e108d8d',
  })
  @ApiConsumes('application/json')
  @ApiBody({
    description:
      'Raw Stripe event payload (must be received as raw body, not parsed)',
    schema: {
      type: 'object',
      example: {
        id: 'evt_1234567890',
        object: 'event',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_1234567890',
            metadata: {
              orderId: '550e8400-e29b-41d4-a716-446655440000',
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook received and processed successfully',
    schema: {
      example: { received: true },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid signature or malformed webhook payload',
  })
  @ApiResponse({
    status: 500,
    description: 'Missing signature or internal server error',
  })
  async handleWebhook(
    @Req() req: RequesrRaw,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!signature) {
      throw new InternalServerErrorException('Stripe signature is missing');
    }

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
        await this.orderService.markAsPaidUpdateStock(orderID);
      } else new InternalServerErrorException(`Error order id: ${orderID}`);
    }

    return { recieved: true };
  }
}
