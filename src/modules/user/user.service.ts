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
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async save(createUserDto: CreateUserDto): Promise<string> {
    if (await this.findByEmail(createUserDto.email)) {
      throw new BadRequestException('Email is already exist');
    }

    createUserDto.password = await hash(createUserDto.password, 10);
    const user = this.userRepository.create(createUserDto);

    try {
      await this.userRepository.save(user);
      return 'user created succesfully';
    } catch (error: unknown) {
      if (error instanceof QueryFailedError) {
        const driverError = error.driverError as { code?: string };
        throw new BadRequestException(driverError.code || 'Database Error');
      }
      //TODO: Implement a good logger manager
      const log = new Logger();
      log.error(error);
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  private async findByEmail(email: string) {
    return await this.userRepository.existsBy({ email: email });
  }
}
