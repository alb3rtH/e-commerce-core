import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/domain/user.entity';
import { Repository } from 'typeorm';
import { compare } from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private authRepository: Repository<User>,
  ) {}

  async findUserByEmail(
    email: string,
    userPassword: string,
  ): Promise<User | null> {
    if (!(await this.authRepository.existsBy({ email: email }))) {
      throw new BadRequestException('email not exist');
    }

    const hashPassword = await this.authRepository.findOne({
      where: {
        email: email,
      },
      select: ['password'],
    });

    if (!(await this.bcrypCompare(userPassword, hashPassword!.password))) {
      throw new BadRequestException('incorrect password');
    }

    const user = await this.authRepository.findOne({
      where: {
        email: email,
      },
      select: ['id', 'name', 'lastname', 'role'],
    });

    return user;
  }

  //TODO: Refact or delete this method

  // async findUserByEmail(email: string): Promise<User | null> {
  //   const user = await this.authRepository.findOne({
  //     where: {
  //       email: email,
  //     },
  //     select: ['id', 'name', 'lastname', 'role'],
  //   });
  //
  //   return user;
  // }

  async bcrypCompare(password: string, hash: string) {
    return compare(password, hash);
  }
}
