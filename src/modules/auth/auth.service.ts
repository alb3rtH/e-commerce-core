import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/domain/user.entity';
import { Repository } from 'typeorm';
import { compare } from 'bcrypt';

/**
 * Authentication service for managing user credential validation operations.
 *
 * @class AuthService
 * @description Provides methods to find users by email and validate passwords
 * using bcrypt for secure password hashing.
 */
@Injectable()
export class AuthService {
  constructor(
    /**
     * TypeORM repository for database operations with the User entity.
     * @private
     * @readonly
     */
    @InjectRepository(User)
    private authRepository: Repository<User>,
  ) {}

  /**
   * Finds a user by their email address and validates the provided password.
   *
   * @async
   * @method findUserByEmail
   * @param {string} email - Email address of the user to search for
   * @param {string} userPassword - Plain text password provided by the user
   * @returns {Promise<User | null>} Promise that resolves with the User object if credentials are valid,
   *                                 or null if the user is not found
   * @throws {BadRequestException} If the email does not exist in the database
   * @throws {BadRequestException} If the provided password does not match the stored hash
   *
   * @example
   * const user = await authService.findUserByEmail('user@example.com', 'myPassword123');
   * if (user) {
   *   console.log(`Welcome ${user.name} ${user.lastname}`);
   * }
   */
  async findUserByEmail(
    email: string,
    userPassword: string,
  ): Promise<User | null> {
    // Verify if the email exists in the database
    if (!(await this.authRepository.existsBy({ email: email }))) {
      throw new BadRequestException('email not exist');
    }

    // Retrieve the stored password hash for the provided email
    const hashPassword = await this.authRepository.findOne({
      where: {
        email: email,
      },
      select: ['password'],
    });

    // Compare the provided password with the stored hash
    if (!(await this.bcrypCompare(userPassword, hashPassword!.password))) {
      throw new BadRequestException('incorrect password');
    }

    // Retrieve user information excluding the password for security
    const user = await this.authRepository.findOne({
      where: {
        email: email,
      },
      select: ['id', 'name', 'lastname', 'role'],
    });

    return user;
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
  async bcrypCompare(password: string, hash: string) {
    return compare(password, hash);
  }
}
