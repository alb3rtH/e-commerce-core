import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { CreateOrderDto } from './dto/createOrder.dto';
import { Product } from '../product/domain/product.entity';
import { Order, OrderItem, OrderStatus } from './domain/order.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class OrderService {
  constructor(
    private readonly datasource: DataSource,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {}

  async createOrder(userID: string, createOrderDto: CreateOrderDto) {
    const queryRunner = this.datasource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let totalAmount: number = 0;
      const orderItems: OrderItem[] = [];

      for (const item of createOrderDto.items) {
        const product = await queryRunner.manager.findOne(Product, {
          where: { id: item.productID },
          lock: { mode: 'pessimistic_write' },
        });

        if (!product || product.stock < item.quantity) {
          throw new BadRequestException(
            `We are currently out of stock for this item: ${product?.name}`,
          );
        }

        product.stock -= item.quantity;
        const orderItem = queryRunner.manager.create(OrderItem, {
          product,
          quantity: item.quantity,
          priceAtPurchase: product.price,
        });

        totalAmount += product.price * item.quantity;
        orderItems.push(orderItem);
      }

      const order = queryRunner.manager.create(Order, {
        user: { id: userID },
        status: OrderStatus.PENDING,
        totalAmount,
        items: orderItems,
      });

      const savedOrder = await queryRunner.manager.save(order);
      await queryRunner.commitTransaction();

      return savedOrder;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      const logger = new Logger('transaccion', { timestamp: true });
      logger.error(error);
    }
  }
  async markAsPaid(orderId: string) {
    const order = await this.orderRepository.findOneBy({ id: orderId });
    if (!order) return;
    order.status = OrderStatus.PAID;
    await this.orderRepository.save(order);
  }
}
