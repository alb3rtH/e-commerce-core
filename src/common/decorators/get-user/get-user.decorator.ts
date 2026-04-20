import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import { Request } from 'express';
import { User } from 'src/modules/user/domain/user.entity';

export const GetUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext): User | any => {
    const request = ctx.switchToHttp().getRequest<Request & { user?: User }>();
    const user = request.user;

    if (!user) {
      throw new InternalServerErrorException(
        'User not found in request (ensure AuthGuard is used)',
      );
    }

    // If an argument is passed (e.g., @GetUser(‘email’)), it returns that property
    // Otherwise, return the entire user object
    return data ? user[data] : user;
  },
);
