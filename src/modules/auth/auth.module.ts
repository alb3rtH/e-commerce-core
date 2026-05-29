import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/domain/user.entity';
import { RefreshToken } from './domain/refresh-token.entity';
import { JwtService } from './jwt/jwt.service';
import { PassportModule } from '@nestjs/passport';
import { JwtAuthGuard } from './jwt/jwt.guard';
import { JwtStrategy } from './jwt/jwt.strategy';
import { TokenService } from './jwt/token.service';
import { randomUUID } from 'crypto';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RefreshToken]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  providers: [
    AuthService,
    TokenService,
    {
      provide: 'ACCESS_TOKEN_SERVICE',
      useFactory: () => {
        return new JwtService({
          algorithm: 'HS256',
          secret: process.env.JWT_ACCESS_SECRET,
          expiresIn: '15m',
          issuer: 'e-commerce-core',
          jwtId: () => randomUUID(),
        });
      },
    },
    {
      provide: 'REFRESH_TOKEN_SERVICE',
      useFactory: () => {
        return new JwtService({
          algorithm: 'HS256',
          secret: process.env.JWT_REFRESH_SECRET,
          expiresIn: '7d',
          issuer: 'e-commerce-core',
          jwtId: () => randomUUID(),
        });
      },
    },
    JwtAuthGuard,
    JwtStrategy,
  ],
  controllers: [AuthController],
})
export class AuthModule {}
