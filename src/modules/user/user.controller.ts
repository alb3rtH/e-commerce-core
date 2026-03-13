import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { CreateUserDto } from './dtos/user.dto';

@Controller('users')
export class UsersController {
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body()
    createUserDto: CreateUserDto,
  ) {}

  @Get()
  getSome(): string {
    return 'Hello World';
  }
}
