//import { ApiProperty } from '@nestjs/swagger';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  MinLength,
  IsEmail,
  Matches,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ type: 'string' })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ type: 'string' })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  lastname: string;

  @ApiProperty({ type: 'string', format: 'email' })
  @IsString()
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
