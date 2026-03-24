import { Injectable } from '@nestjs/common';
import { Order } from '../order/domain/order.entity';
import { Stripe } from 'stripe';

@Injectable()
export class PaymentService {
  // En payments.service.ts
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
  }

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
      success_url: 'http://localhost:3000/success',
      cancel_url: 'http://localhost:3000/cancel',
      metadata: { orderId: order.id },
    });
    return { url: session.url };
  }

  constructEvent(payload: Buffer, signature: string) {
    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_SECRET_KEY || '',
    );
  }
}
