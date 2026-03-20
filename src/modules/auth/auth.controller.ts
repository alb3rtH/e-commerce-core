import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthDto } from './dto/auth.dto';
import { AuthService } from './auth.service';
import { JwtService } from './jwt/jwt.service';
import { JWTPayload } from 'jose';
import { JwtAuthGuard } from './jwt/jwt.guard';
import type { RequestWithUser } from './jwt/interfaces/jwt.interfaces';

/**
 * Controller responsible for handling authentication-related HTTP requests.
 * Provides endpoints for user sign-in operations and JWT token generation.
 *
 * @example
 * // Usage in a NestJS module
 * @Module({
 *   controllers: [AuthController],
 *   providers: [AuthService, JwtService],
 * })
 * export class AuthModule {}
 */
@Controller('auth')
export class AuthController {
  /**
   * Creates an instance of AuthController.
   *
   * @param authService - Service handling authentication business logic and user retrieval
   * @param jwtService - Service responsible for JWT token generation and validation
   */
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService<JWTPayload>,
  ) {}

  /**
   * Authenticates a user and generates a JWT access token.
   *
   * @remarks
   * This endpoint validates user credentials against the database. Upon successful
   * authentication, a JWT token containing user information is returned.
   *
   * @param authDto - Data transfer object containing user credentials (email and password)
   * @returns An object containing the signed JWT access token
   * @throws {InternalServerErrorException} When user authentication fails or user is not found
   *
   * @example
   * // Request body
   * {
   *   "email": "user@example.com",
   *   "password": "securePassword123"
   * }
   *
   * // Successful response (201 created)
   * {
   *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   * }
   */
  @Post('signin')
  @HttpCode(HttpStatus.CREATED)
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
  /**
   * @remarks
   * this controller authguard is just for debug validate tokens
   * */
  @UseGuards(JwtAuthGuard)
  @Get('authguard')
  authguard(@Request() req: RequestWithUser) {
    return req.user;
  }
}
