import { Body, Controller, HttpStatus, Post, UseGuards } from '@nestjs/common';
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

@ApiTags()
@ApiBearerAuth()
@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

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
  async create(@Body() createOrderdto: CreateOrderDto, @GetUser() user: User) {
    const order = await this.orderService.createOrder(user.id, createOrderdto);
    return order;
    //TODO: ok ahora que ya tengo creado la orden necesito hacer el module/payment
  }
}
