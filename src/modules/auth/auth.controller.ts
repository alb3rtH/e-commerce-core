import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Post,
} from '@nestjs/common';
import { AuthDto } from './dto/auth.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('signin')
  @HttpCode(HttpStatus.FOUND)
  async login(@Body() authDto: AuthDto) {
    if (!(await this.authService.findByEmail(authDto.email))) {
      throw new BadRequestException('email is not found');
    }

    const hash = await this.authService.findPsswdByEmail(authDto.email)
    if (!hash) {
      throw new InternalServerErrorException()
    }

    return (await this.authService.bcrypCompare(authDto.password, hash)) ? "welcome" : "password incorrect"
  }
}
