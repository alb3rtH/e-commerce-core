import { Injectable } from '@nestjs/common';
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

  async findByEmail(email: string): Promise<boolean> {
    return await this.authRepository.existsBy({ email: email });
  }

  async findPsswdByEmail(email: string): Promise<string> {
    const user = await this.authRepository.findOne({
      where: {
        email: email,
      },
      select: ['password'],
    });
    if (!user?.password) {
      return '';
    }

    return user.password;
  }

  async bcrypCompare(password: string, hash: string) {
    return compare(password, hash);
  }
}
