import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/domain/user.entity';
import { JwtService } from './jwt/jwt.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [
    AuthService,
    {
      provide: JwtService,
      useFactory: () => {
        return new JwtService({
          // ← return explícito
          algorithm: 'HS256',
          secret: process.env.JWT_SECRET,
          expiresIn: '1m',
          issuer: 'e-commerce-core',
        });
      },
    },
  ],
  controllers: [AuthController],
})
export class AuthModule {}
