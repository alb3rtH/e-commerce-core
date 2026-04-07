import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ type: 'string' })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  name: string;

  @ApiProperty({ type: 'string' })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(12)
  sku: string;

  @ApiProperty({ type: 'string' })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(12)
  description: string;

  @ApiProperty({ type: 'number' })
  @IsNotEmpty()
  @IsInt() // the value is cent 100 = 1$
  @Min(0)
  price: number;

  @IsInt() // the value is cent 100 = 1$
  @IsOptional()
  @Min(0)
  stock: number;
}
