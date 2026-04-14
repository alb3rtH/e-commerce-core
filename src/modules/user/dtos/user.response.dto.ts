import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  MinLength,
  IsEmail,
  // Matches,
} from 'class-validator';

export class ResponseUserDto {
  @ApiProperty({ type: 'string' })
  // @IsNotEmpty()
  // @IsString()
  // @MinLength(2)
  name: string;

  @ApiProperty({ type: 'string' })
  // @IsNotEmpty()
  // @IsString()
  // @MinLength(2)
  lastname: string;

  @ApiProperty({ type: 'string', format: 'email' })
  // @IsString()
  // @IsNotEmpty()
  // @IsEmail()
  email: string;
}
