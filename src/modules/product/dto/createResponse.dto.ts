import { ApiProperty } from '@nestjs/swagger';

export class CreateResponseDto {
  @ApiProperty({ type: 'string' })
  id: string;

  @ApiProperty({ type: 'string' })
  name: string;

  @ApiProperty({ type: 'string' })
  sku: string;

  @ApiProperty({ type: 'string' })
  description: string;

  @ApiProperty({ type: 'number' })
  price: number;

  @ApiProperty({ type: 'number' })
  stock: number;

  @ApiProperty({ type: 'string' })
  createdAt: string;

  @ApiProperty({ type: 'string' })
  updatedAt: string;
}
