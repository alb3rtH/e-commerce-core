import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

export class UpdatePasswordDto {
  @ApiProperty({ type: 'string', format: 'password' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @Matches(/^\S*$/, { message: 'Current password cannot contain only spaces' })
  currentPassword: string;

  @ApiProperty({ type: 'string', format: 'password' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @Matches(/^\S*$/, { message: 'New password cannot contain only spaces' })
  newPassword: string;
}

