import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/domain/user.entity';
import { QueryFailedError, Repository } from 'typeorm';
import { compare, hash } from 'bcrypt';
import { UpdatePasswordDto } from './dto/update-password.dto';

/**
 * Authentication service for managing user credential validation operations.
 *
 * @class AuthService
 * @description Provides methods to find users by email and validate passwords
 * using bcrypt for secure password hashing.
 */
@Injectable()
export class AuthService {
  private logger: Logger;
  constructor(
    /**
     * TypeORM repository for database operations with the User entity.
     * @private
     * @readonly
     */
    @InjectRepository(User)
    private authRepository: Repository<User>,
  ) {
    this.logger = new Logger(AuthService.name);
  }

  /**
   * Finds a user by their email address and validates the provided password.
   *
   * @async
   * @method findUserByEmail
   * @param {string} email - Email address of the user to search for
   * @param {string} userPassword - Plain text password provided by the user
   * @returns {Promise<User | null>} Promise that resolves with the User object if credentials are valid,
   *                                 or null if the user is not found
   * @throws {UnauthorizedException} If the email does not exist in the database
   * @throws {UnauthorizedException} If the provided password does not match the stored hash
   *
   * @example
   * const user = await authService.findUserByEmail('user@example.com', 'myPassword123');
   * if (user) {
   *   console.log(`Welcome ${user.name} ${user.lastname}`);
   * }
   */
  async findUserByEmail(
    email: string,
    password: string,
  ): Promise<Omit<User, 'password'>> {
    const user: User | null = await this.authRepository.findOne({
      where: { email },
      select: ['id', 'name', 'lastname', 'role', 'email', 'password'],
    });

    if (!user) {
      throw new UnauthorizedException('Email is not found');
    }

    const isMatch: boolean = await this.compareHashPsswd(
      password,
      user.password,
    );
    if (!isMatch) {
      throw new UnauthorizedException('Incorrect Password');
    }

    const { password: _, ...result } = user;

    return result;
  }

  /**
   * Compares a plain text password with its hashed version using bcrypt.
   *
   * @async
   * @method bcrypCompare
   * @param {string} password - Plain text password to verify
   * @param {string} hash - Password hash stored in the database
   * @returns {Promise<boolean>} Promise that resolves with true if the password matches the hash,
   *                             false otherwise
   *
   * @example
   * const isValid = await authService.bcrypCompare('myPassword', '$2b$10$...');
   * if (isValid) {
   *   console.log('Valid password');
   * }
   */
  private async compareHashPsswd(password: string, hash: string) {
    return compare(password, hash);
  }

  //FIX: ¿Por qué no se incluye el updatedAt cuando cambio el password?
  async updatePassword(
    userId: string,
    updatePasswordDto: UpdatePasswordDto,
  ): Promise<Omit<User, 'password'> | undefined> {
    const user = await this.authRepository.findOne({
      where: { id: userId },
      select: ['id', 'password'], // Include password for verification
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const isPasswordValid = await compare(
      updatePasswordDto.currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashedNewPassword = await hash(updatePasswordDto.newPassword, 10);

    try {
      await this.authRepository.update(userId, { password: hashedNewPassword });
      // Return user without password
      const updatedUser = await this.findOneUser(userId);
      if (updatedUser) {
        return updatedUser;
      }
    } catch (error: unknown) {
      if (error instanceof QueryFailedError) {
        const driverError = error.driverError as { code?: string };
        throw new BadRequestException(driverError.code || 'Database Error');
      }
      this.logger.error(error);
      throw new InternalServerErrorException('Failed to update password');
    }
  }

  async findOneUser(userId: string) {
    try {
      return await this.authRepository.findOne({
        where: { id: userId },
      });
    } catch (error: unknown) {
      if (error instanceof QueryFailedError) {
        const driverError = error.driverError as { code?: string };
        this.logger.error(error);
        throw new BadRequestException(driverError.code || 'Database Error');
      }

      this.logger.error(error);
      throw new InternalServerErrorException('Failed to find user');
    }
  }
}
