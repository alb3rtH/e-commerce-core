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

@Injectable()
export class UserService {
  private logger: Logger;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    this.logger = new Logger(UserService.name);
  }

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

  async findOneUser(userId: string) {
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

  async findAllUsers() {
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

  private async findByEmail(email: string) {
    return await this.userRepository.existsBy({ email: email });
  }
}
