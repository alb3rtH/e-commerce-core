import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpStatus,
  NotFoundException,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { CreateOrderDto } from './dto/createOrder.dto';
import { GetUser } from 'src/common/decorators/get-user/get-user.decorator';
import { User, UserRole } from '../user/domain/user.entity';
import { PaymentService } from '../payment/payment.service';
import { Roles } from 'src/common/roles/roles.decorator';
import { Order } from './domain/order.entity';

@ApiTags('Orders')
@Controller('orders')
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly paymentService: PaymentService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'create a new orden',
    description:
      'Protected endpoint for users with the “Customer” role to create an order returns a 200',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'orden created successfuly',
    schema: {
      example: {
        statusCode: HttpStatus.CREATED,
        message: 'orden created successfully',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'invalid data or insufficient stock',
    schema: {
      example: {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'invalid data or insufficient stock',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'unauthorized',
    schema: {
      example: {
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Untracked Error',
    schema: {
      example: {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal Server Error',
      },
    },
  })
  async create(@Body() createOrderdto: CreateOrderDto, @GetUser() user: User) {
    //1. create the order in the database (Status: PENDING)

    //2. generate the Stripe session immediately
    const order = await this.orderService.createOrder(user.id, createOrderdto);

    if (order) {
      const session = await this.paymentService.createCheckoutSession(order);
      return {
        orderID: order.id,
        checkoutUrl: session.url,
      };
    }
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'get all my order' })
  @ApiBearerAuth('access-token')
  @ApiResponse({
    description: 'return a list of all my order with credentials ',
    status: HttpStatus.OK,
    schema: {
      example: [
        {
          id: '83836011-53bd-4a1d-9301-879b811fa750',
          status: 'pending',
          totalAmount: 3000,
        },
        {
          id: '7e602554-e63a-47c5-811f-c7a56fe5648a',
          status: 'paid',
          totalAmount: 8000,
        },
      ],
    },
  })
  @ApiResponse({
    description: 'Driver Error Code',
    status: HttpStatus.BAD_REQUEST,
    schema: {
      example: {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 23505,
      },
    },
  })
  @ApiResponse({
    description: 'Failed to find orders',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    schema: {
      example: {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Untracked Error',
      },
    },
  })
  async myOrders(@GetUser('id') userID: string) {
    return await this.orderService.findOrdersByUserID(userID);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'get a order by orderID' })
  @ApiQuery({
    name: 'orderID',
    required: true,
    type: String,
    description: 'the UUID of the order you want to retrieve',
    example: 'effa2575-00a7-4055-9fb5-70e3419998fc',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Order not Found or Not exist',
    schema: {
      example: {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Order not found',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Database Error',
    schema: {
      example: {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Database Error',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    schema: {
      example: {
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Unauthorized',
        error: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Untracked error',
    schema: {
      example: {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Inernal Server Error',
        error: 'Untracked error',
      },
    },
  })
  async getOrderByID(
    @Query('orderID') orderID: string,
    @GetUser() user: User,
  ): Promise<Order> {
    const order = await this.orderService.findOrderByID(orderID);

    if (!order) {
      throw new NotFoundException('Order not found');
    } else if (
      order.user.id === user.id ||
      (user.role as string) === (UserRole.ADMIN as string)
    ) {
      return order;
    } else {
      throw new ForbiddenException("You're not the owner or admin ");
    }
  }
}
