import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/domain/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private authRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<string> {
    if (!(await this.authRepository.existsBy({ email: email }))) {
      throw new BadRequestException('email not found');
    }

    return `found by email: ${email}`;
  }
}
