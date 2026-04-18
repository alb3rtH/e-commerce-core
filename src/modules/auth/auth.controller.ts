import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthDto } from './dto/auth.dto';
import { AuthService } from './auth.service';
import { JwtService } from './jwt/jwt.service';
import { JWTPayload } from 'jose';
import { GetUser } from 'src/common/decorators/get-user/get-user.decorator';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { JwtAuthGuard } from './jwt/jwt.guard';
import { SigninResponse } from './dto/siginResponse.dto';
import { User } from '../user/domain/user.entity';

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
   * @throws {UnauthorizedException} When user authentication fails (invalid credentials)
   *
   * @example
   * // Request body
   * {
   *   "email": "user@example.com",
   *   "password": "securePassword123"
   * }
   *
   * // Successful response (201 created)
   *
   * {
   *  "userID": "8237959a-0b33-4f90-816e-b3ecdd18e815",
   *   "loginAt": "2026-04-18T08:18:00.804Z",
   *  "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6Imp3dCJ9....
   * }
   */
  @Post('signin')
  @HttpCode(HttpStatus.CREATED)
  async signin(@Body() authDto: AuthDto): Promise<SigninResponse> {
    const user: Omit<User, 'password'> = await this.authService.findUserByEmail(
      authDto.email,
      authDto.password,
    );
    const token = await this.jwtService.signToken(user);

    return {
      userID: user.id,
      loginAt: new Date(),
      jwt: token,
    };
  }

  //TODO: ¿Por qué no se incluye el updatedAt cuando cambió el password?
  @Patch('update-password')
  @UseGuards(JwtAuthGuard)
  async updatePassword(
    @GetUser('id') userId: string,
    @Body() updatedPasswordDto: UpdatePasswordDto,
  ) {
    return await this.authService.updatePassword(userId, updatedPasswordDto);
  }
}
