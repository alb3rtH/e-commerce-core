import {
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from './jwt.service';
import { JWTPayload, jwtVerify } from 'jose';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshToken } from '../domain/refresh-token.entity';
import { IsNull, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { compare, hash } from 'bcrypt';

@Injectable()
export class TokenService {
  constructor(
    @Inject('ACCESS_TOKEN_SERVICE')
    private readonly accessTokenService: JwtService<JWTPayload>,
    @Inject('REFRESH_TOKEN_SERVICE')
    private readonly refreshTokenService: JwtService<JWTPayload>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
  ) {}

  async generatePair(userId: string, userPayload: Record<string, unknown>) {
    const family = randomUUID();

    const [accessToken, refreshToken] = await Promise.all([
      this.accessTokenService.signToken({
        sub: userId,
        user: userPayload,
        type: 'access',
        fam: family,
      }),

      this.refreshTokenService.signToken({
        sub: userId,
        type: 'refresh',
        fam: family,
      }),
    ]);

    const hashedToken = await hash(refreshToken, 10);

    await this.refreshTokenRepo.save({
      userId,
      family,
      hashedToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return { accessToken, refreshToken, family };
  }

  async verifyToken(token: string) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET);
      const { payload } = await jwtVerify(token, secret, {
        issuer: 'e-commerce-core',
      });
      return payload;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new UnauthorizedException(error);
      } else {
        throw new InternalServerErrorException(error);
      }
    }
  }

  async rotate(
    oldRefreshToken: string,
    userId: string,
    userPayload: Record<string, unknown>,
  ) {
    const stored = await this.refreshTokenRepo.findOne({
      where: { userId, revokedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });

    if (!stored) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const isValid = await compare(oldRefreshToken, stored.hashedToken);

    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (new Date() > stored.expiresAt) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const family = stored.family;

    const [accessToken, refreshToken] = await Promise.all([
      this.accessTokenService.signToken({
        sub: userId,
        user: userPayload,
        type: 'access',
        fam: family,
      }),

      this.refreshTokenService.signToken({
        sub: userId,
        type: 'refresh',
        fam: family,
      }),
    ]);

    await this.refreshTokenRepo.update(
      { family, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );

    const hashedToken = await hash(refreshToken, 10);

    await this.refreshTokenRepo.save({
      userId,
      family,
      hashedToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return { accessToken, refreshToken };
  }

  async revokeFamily(family: string) {
    await this.refreshTokenRepo.update({ family }, { revokedAt: new Date() });
  }

  async revokeForUser(userId: string) {
    await this.refreshTokenRepo.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }
}
