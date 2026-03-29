import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderItemDto {
  @ApiProperty({
    description: 'Unique identifier of the product (UUID v4)',
    format: 'uuid',
    example: 'd9a2870f-6fd2-4411-8ad8-0dddd8d2da36',
  })
  @IsUUID('4', { message: 'ID product is not UUID valid' })
  productID: string;

  @ApiProperty({
    description: 'Quantity of the product to purchase',
    minimum: 1,
    example: 2,
  })
  @IsInt({ message: 'the quantity is not a integer' })
  @Min(1, { message: 'the minimum acceptable quantity is 1' })
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({
    description: 'array of items',
    type: [CreateOrderItemDto],
    minItems: 1,
    example: [
      { producID: '6c5ee411-8f15-4c4b-8513-e299b00e597a', quantity: 2 },
      { producID: '5f85436b-a731-463b-b8cf-ac7ed122fb74', quantity: 1 },
      { producID: 'd202536f-4d68-4b3f-a378-b4706d9273ee', quantity: 1 },
    ],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'The order must include at least one item' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
