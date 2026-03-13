import {
  IsNotEmpty,
  IsString,
  MinLength,
  IsEmail,
  Matches,
} from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  name: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  lastname: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @Matches(/^\S*$/, { message: 'Password cannot contain only spaces' })
  password: string;
}
