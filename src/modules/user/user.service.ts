import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './domain/user.entity';
import { QueryFailedError, Repository } from 'typeorm';
import { CreateUserDto } from './dtos/user.dto';
import { hash } from 'bcrypt';

/**
 * Service responsible for managing user-related operations.
 * Provides functionality for creating, retrieving, and validating users
 * while handling password hashing and database error management.
 *
 * @class UserService
 * @implements {Injectable}
 */
@Injectable()
export class UserService {
  /**
   * Logger instance for the UserService class.
   * Used to log errors and debugging information throughout the service.
   *
   * @private
   * @type {Logger}
   */
  private logger: Logger;

  /**
   * Creates an instance of UserService.
   * Initializes the logger and injects the User repository dependency.
   *
   * @constructor
   * @param {Repository<User>} userRepository - TypeORM repository for User entity operations
   */
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    this.logger = new Logger(UserService.name);
  }

  /**
   * Creates and persists a new user in the database.
   * Validates email uniqueness, hashes the password, and returns the created user
   * without the sensitive password field.
   *
   * @async
   * @param {CreateUserDto} createUserDto - Data transfer object containing user creation data
   * @returns {Promise<Omit<User, 'password'>>} Promise resolving to the created user object excluding the password
   * @throws {BadRequestException} When the email already exists or a database constraint violation occurs
   * @throws {InternalServerErrorException} When an unexpected error occurs during user creation
   *
   * @example
   * const newUser = await userService.saveOneUser({
   *   email: 'user@example.com',
   *   password: 'securePassword123'
   * });
   */
  async saveOneUser(
    createUserDto: CreateUserDto,
  ): Promise<Omit<User, 'password'>> {
    if (await this.findByEmail(createUserDto.email)) {
      throw new BadRequestException('Email is already exist');
    }

    createUserDto.password = await hash(createUserDto.password, 10);
    const user = this.userRepository.create(createUserDto);

    try {
      const savedUser = await this.userRepository.save(user);
      const { password, ...userWithoutPassword } = savedUser;
      return userWithoutPassword;
    } catch (error: unknown) {
      if (error instanceof QueryFailedError) {
        const driverError = error.driverError as { code?: string };
        throw new BadRequestException(driverError.code || 'Database Error');
      }
      this.logger.error(error);
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  /**
   * Retrieves a single user by their unique identifier.
   *
   * @async
   * @param {string} userId - The unique identifier of the user to retrieve
   * @returns {Promise<User | null>} Promise resolving to the user entity if found, null otherwise
   * @throws {BadRequestException} When a database query error occurs
   * @throws {InternalServerErrorException} When an unexpected error occurs during the retrieval
   *
   * @example
   * const user = await userService.findOneUser('123e4567-e89b-12d3-a456-426614174000');
   */
  async findOneUser(userId: string): Promise<User | null> {
    try {
      return await this.userRepository.findOne({
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

  /**
   * Retrieves all users from the database.
   *
   * @async
   * @returns {Promise<User[]>} Promise resolving to an array of all user entities
   * @throws {BadRequestException} When a database query error occurs
   * @throws {InternalServerErrorException} When an unexpected error occurs during the retrieval
   *
   * @example
   * const allUsers = await userService.findAllUsers();
   */
  async findAllUsers(): Promise<User[]> {
    try {
      return this.userRepository.find();
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

  /**
   * Checks if a user with the specified email address exists in the database.
   * This is a private helper method used for email uniqueness validation.
   *
   * @async
   * @private
   * @param {string} email - The email address to check for existence
   * @returns {Promise<boolean>} Promise resolving to true if the email exists, false otherwise
   */
  private async findByEmail(email: string): Promise<boolean> {
    return await this.userRepository.existsBy({ email: email });
  }
}
