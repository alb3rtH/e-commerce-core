import {
  Body,
  Controller,
  HttpStatus,
  InternalServerErrorException,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { CreateOrderDto } from './dto/createOrder.dto';
import { GetUser } from 'src/common/decorators/get-user/get-user.decorator';
import { User } from '../user/domain/user.entity';
import { PaymentService } from '../payment/payment.service';

@ApiTags('orders')
@ApiBearerAuth()
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
    const order = await this.orderService.createOrder(user.id, createOrderdto);

    //2. generate the Stripe session immediately
    if (!order) {
      throw new InternalServerErrorException('order not generate');
    }

    const session = await this.paymentService.createCheckoutSession(order);
    return {
      orderID: order.id,
      checkoutUrl: session.url,
    };
  }
}
