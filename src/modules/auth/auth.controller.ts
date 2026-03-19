import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Post,
} from '@nestjs/common';
import { AuthDto } from './dto/auth.dto';
import { AuthService } from './auth.service';
import { JwtService } from 'src/common/jwt/jwt.service';
import { JWTPayload } from 'jose';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService<JWTPayload>,
  ) {}

  @Post('signin')
  @HttpCode(HttpStatus.FOUND)
  async signin(@Body() authDto: AuthDto) {
    const user = await this.authService.findUserByEmail(
      authDto.email,
      authDto.password,
    );
    if (!user) {
      throw new InternalServerErrorException();
    }
    const token = await this.jwtService.signToken({ user: user });

    return {
      token: token,
    };
  }
}
