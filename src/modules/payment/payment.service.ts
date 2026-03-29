import { Injectable } from '@nestjs/common';
import { Order } from '../order/domain/order.entity';
import { Stripe } from 'stripe';

/**
 * Service responsible for handling Stripe payment operations,
 * including checkout session creation and webhook verification.
 */
@Injectable()
export class PaymentService {
  /** Stripe SDK instance for API interactions */
  private stripe: Stripe;
  /** Secret key for verifying Stripe webhook signatures */
  private stripeSecretKey: string;

  /**
   * Initializes the Stripe SDK with environment configuration.
   * @throws {Error} If STRIPE_SECRET_KEY environment variable is not set
   */
  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
    this.stripeSecretKey = process.env.STRIPE_SECRET_WEBHOOK || '';
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
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: order.items.map((item) => ({
        price_data: {
          currency: 'usd',
          product_data: { name: item.product.name },
          unit_amount: item.priceAtPurchase,
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: 'http://localhost:8080/success',
      cancel_url: 'http://localhost:8080/cancel',
      metadata: { orderId: order.id },
    });
    return { url: session.url };
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
    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      this.stripeSecretKey,
    );
  }
}
