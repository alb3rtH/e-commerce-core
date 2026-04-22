import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { CreateOrderDto } from './dto/createOrder.dto';
import { Product } from '../product/domain/product.entity';
import { Order, OrderItem, OrderStatus } from './domain/order.entity';
import { InjectRepository } from '@nestjs/typeorm';

/**
 * Service responsible for managing purchase orders.
 * Handles order creation with transaction control and
 * payment processing with inventory updates.
 */
@Injectable()
export class OrderService {
  private logger: Logger;
  /**
   * Creates an instance of the order service.
   * @param datasource - TypeORM data source for transaction management
   * @param orderRepository - TypeORM repository for order CRUD operations
   */
  constructor(
    private readonly datasource: DataSource,

    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {
    this.logger = new Logger(OrderService.name);
  }

  /**
   * Creates a new purchase order for a user.
   *
   * @remarks
   * This method executes a database transaction that:
   * - Verifies stock availability for each product
   * - Calculates the total order amount
   * - Creates order items with the price at the time of purchase
   *
   * @param userID - Unique identifier of the user making the purchase
   * @param createOrderDto - DTO containing order items and details
   * @returns The created order with its generated ID
   * @throws {BadRequestException} If there is insufficient stock for any product
   *
   * @example
   * ```typescript
   * const order = await orderService.createOrder('user-123', {
   *   items: [{ productID: 'prod-456', quantity: 2 }]
   * });
   * ```
   */
  async createOrder(
    userID: string,
    createOrderDto: CreateOrderDto,
  ): Promise<Order | undefined> {
    const queryRunner = this.datasource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let totalAmount: number = 0;
      const orderItems: OrderItem[] = [];

      for (const item of createOrderDto.items) {
        const product: Product | null = await queryRunner.manager.findOne(
          Product,
          {
            where: { id: item.productID },
            lock: { mode: 'pessimistic_write' },
          },
        );

        if (!product || product.stock < item.quantity) {
          throw new BadRequestException(
            `We are currently out of stock for this item: ${product?.name}`,
          );
        }

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
    } catch (error: unknown) {
      await queryRunner.rollbackTransaction();
      if (error instanceof HttpException) {
        this.logger.error(error.message ?? error, error);
        throw error;
      }
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Marks an order as paid and updates product inventory.
   *
   * @remarks
   * This method:
   * - Finds the order with its items and related products
   * - Decrements the stock of each product according to the purchased quantity
   * - Updates the order status to PAID
   *
   * @param orderId - Unique identifier of the order to process
   * @returns Promise that resolves when the operation completes
   *
   * @example
   * ```typescript
   * await orderService.markAsPaid('order-789');
   * ```
   */
  async markAsPaidUpdateStock(orderId: string) {
    const queryRunner = this.datasource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const order = await queryRunner.manager.findOne(Order, {
        where: { id: orderId },
        relations: ['items', 'items.product'],
      });

      if (!order) {
        throw new NotFoundException(`Order not found with id: ${orderId}`);
      }

      if (order.status === OrderStatus.PAID) {
        return order;
      }

      if (order.status !== OrderStatus.PENDING) {
        throw new BadRequestException(
          `Order with id ${orderId} cannot be processed from status ${order.status}`,
        );
      }

      for (const item of order.items) {
        if (!item.product) {
          throw new BadRequestException(
            `Missing product in one of the order items for order ${orderId}`,
          );
        }

        if (item.product.stock < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for product ${item.product.name} (${item.product.id})`,
          );
        }

        await queryRunner.manager
          .createQueryBuilder()
          .update(Product)
          .set({ stock: () => `stock - ${item.quantity}` })
          .where('id = :id AND stock >= :quantity', {
            id: item.product.id,
            quantity: item.quantity,
          })
          .execute();
      }

      order.status = OrderStatus.PAID;
      const updatedOrder = await queryRunner.manager.save(order);
      await queryRunner.commitTransaction();

      return updatedOrder;
    } catch (error: unknown) {
      await queryRunner.rollbackTransaction();
      if (error instanceof HttpException) {
        this.logger.error(error?.message ?? error, error);
        throw error;
      }
    } finally {
      await queryRunner.release();
    }
  }

  async findOrdersByUserID(userID: string): Promise<Order[]> {
    try {
      const orders = await this.orderRepository.find({
        where: { user: { id: userID } },
      });

      return orders;
    } catch (error: unknown) {
      if (error instanceof QueryFailedError) {
        const driverError = error.driverError as { code?: string };
        this.logger.error(error);
        throw new BadRequestException(driverError.code || 'Database Error');
      }

      this.logger.error(error);
      throw new InternalServerErrorException('Failed to find order');
    }
  }

  async findOrderByID(orderID: string): Promise<Order | null> {
    try {
      const order = await this.orderRepository.findOne({
        where: { id: orderID },
        relations: ['user'],
        select: {
          id: true,
          items: true,
          status: true,
          totalAmount: true,
          user: true,
        },
      });

      return order;
    } catch (error: unknown) {
      if (error instanceof QueryFailedError) {
        const driverError = error.driverError as { code?: string };
        this.logger.error(error);
        throw new BadRequestException(driverError.code || 'Database Error');
      }

      this.logger.error(error);
      throw new InternalServerErrorException('Failed to find order');
    }
  }
}
