import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CreateUserDto } from './dtos/user.dto';

@Controller('users')
export class UsersController {
  @Post('user')
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body()
    createUserDto: CreateUserDto,
  ) {}
}
