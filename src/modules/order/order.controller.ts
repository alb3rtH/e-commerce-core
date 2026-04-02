import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { CreateOrderDto } from './dto/createOrder.dto';
import { GetUser } from 'src/common/decorators/get-user/get-user.decorator';
import { User } from '../user/domain/user.entity';
import { PaymentService } from '../payment/payment.service';
//import { Order } from './domain/order.entity';

@ApiTags('orders')
@Controller('order')
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly paymentService: PaymentService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'create a new orden' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'orden created successfuly',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'invalid data or insufficient stock',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'order not generate',
  })
  async create(@Body() createOrderdto: CreateOrderDto, @GetUser() user: User) {
    //1. create the order in the database (Status: PENDING)
    try {
      //2. generate the Stripe session immediately
      const order = await this.orderService.createOrder(
        user.id,
        createOrderdto,
      );

      if (order) {
        const session = await this.paymentService.createCheckoutSession(order);
        return {
          orderID: order.id,
          checkoutUrl: session.url,
        };
      }
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create order');
    }
  }
}
