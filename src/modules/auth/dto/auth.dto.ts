import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class AuthDto {
  @ApiProperty({ type: 'string', format: 'email' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ type: 'string', format: 'password' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @Matches(/^\S*$/, { message: 'Password cannot contain only spaces' })
  password: string;
}
