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
  @ApiProperty({ type: 'string', example: 'blue t-shirt' })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  name: string;

  @ApiProperty({ type: 'string', example: 'tshirt-blue' })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(12)
  sku: string;

  @ApiProperty({ type: 'string', example: 'a simple description of product' })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  description: string;

  @ApiProperty({ type: 'number', example: 1000 })
  @IsNotEmpty()
  @IsInt() // the value is cent 100 = 1$
  @Min(0)
  price: number;

  @ApiProperty({ required: false, example: 80 })
  @IsInt() // the value is cent 100 = 1$
  @IsOptional()
  @Min(0)
  stock: number;
}
