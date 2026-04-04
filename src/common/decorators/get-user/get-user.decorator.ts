import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
// import { User } from 'src/modules/user/domain/user.entity';

export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new InternalServerErrorException('user not found in request');
    }

    return data ? user[data] : user;
  },
);
