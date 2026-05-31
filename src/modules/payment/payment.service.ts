import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Order } from '../order/domain/order.entity';
import { Stripe } from 'stripe';

/**
 * Service responsible for handling Stripe payment operations,
 * including checkout session creation and webhook verification.
 */
@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  /** Stripe SDK instance for API interactions */
  private stripe: Stripe;
  /** Secret key for verifying Stripe webhook signatures */
  private stripeSecretKey: string;
  /** Success URL for checkout session */
  private successUrl: string;
  /** Cancel URL for checkout session */
  private cancelUrl: string;

  /**
   * Initializes the Stripe SDK with environment configuration.
   * @throws {Error} If required Stripe environment variables are not set
   */
  constructor() {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const stripeWebhook = process.env.STRIPE_SECRET_WEBHOOK;
    this.successUrl =
      process.env.STRIPE_SUCCESS_URL || 'http://localhost:8080/success';
    this.cancelUrl =
      process.env.STRIPE_CANCEL_URL || 'http://localhost:8080/cancel';

    if (!stripeKey) {
      this.logger.error('STRIPE_SECRET_KEY is missing');
      throw new InternalServerErrorException(
        'STRIPE_SECRET_KEY environment variable is required',
      );
    }

    if (!stripeWebhook) {
      this.logger.error('STRIPE_SECRET_WEBHOOK is missing');
      throw new InternalServerErrorException(
        'STRIPE_SECRET_WEBHOOK environment variable is required',
      );
    }

    this.stripe = new Stripe(stripeKey, { apiVersion: '2026-02-25.clover' });
    this.stripeSecretKey = stripeWebhook;
  }

  /**
   * Creates a Stripe Checkout Session for an order.
   *
   * @remarks
   * Generates a payment session with line items from the order.
   * Redirects to success/cancel URLs after payment attempt.
   * Stores the order ID in metadata for webhook reconciliation.
   *
   * @param order - The order entity containing items and pricing information
   * @returns Object containing the checkout session URL for redirection
   * @throws {Stripe.errors.StripeError} If session creation fails
   */
  async createCheckoutSession(order: Order) {
    if (!order) {
      throw new BadRequestException(
        'Order is required to generate Checkout Session',
      );
    }

    if (!order.id) {
      throw new BadRequestException('Order ID is required in order metadata');
    }

    if (!Array.isArray(order.items) || order.items.length === 0) {
      throw new BadRequestException('Order must include at least one item');
    }

    const lineItems = order.items.map((item) => {
      if (!item.product?.name) {
        throw new BadRequestException('Order item must include a product name');
      }

      if (item.priceAtPurchase <= 0 || item.quantity <= 0) {
        throw new BadRequestException(
          'Order item price and quantity must be greater than 0',
        );
      }

      return {
        price_data: {
          currency: process.env.STRIPE_CURRENCY || 'usd',
          product_data: { name: item.product.name },
          unit_amount: item.priceAtPurchase,
        },
        quantity: item.quantity,
      };
    });

    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: this.successUrl,
        cancel_url: this.cancelUrl,
        metadata: { orderId: order.id },
      });

      if (!session.url) {
        this.logger.error('Stripe session created without URL');
        throw new InternalServerErrorException(
          'Stripe failed to create checkout session',
        );
      }

      return { url: session.url };
    } catch (error) {
      this.logger.error('Stripe checkout session creation failed', error);
      throw new InternalServerErrorException(
        'Unable to create Stripe checkout session',
      );
    }
  }

  /**
   * Verifies and constructs a Stripe event from webhook payload.
   *
   * @remarks
   * Uses Stripe's webhook signature verification to ensure the event
   * authenticity. Must use the raw request body (not parsed JSON).
   *
   * @param payload - Raw request body as Buffer (unparsed)
   * @param signature - Signature from 'stripe-signature' header
   * @returns Constructed Stripe event object
   * @throws {Stripe.errors.StripeSignatureVerificationError} If signature is invalid
   */
  constructEvent(payload: Buffer, signature: string) {
    if (!payload || !signature) {
      this.logger.error('Webhook payload/signature missing');
      throw new BadRequestException('Webhook payload or signature is missing');
    }

    try {
      return this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.stripeSecretKey,
      );
    } catch (error) {
      this.logger.error('Stripe webhook signature verification failed', error);
      throw error;
    }
  }
}
