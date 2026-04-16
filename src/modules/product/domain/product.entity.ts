import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  CreateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ example: 'd69a747d-f463-4f52-8e2d-29260a4ddb2e' })
  id: string;

  @Column()
  @ApiProperty({ example: 'tshirt-blue' })
  name: string;

  @Column({ unique: true })
  @ApiProperty({ example: 'tshirt-blue' })
  sku: string;

  @Column({ type: 'text' })
  @ApiProperty({ example: 'a simple description of Product' })
  description: string;

  @Column({ type: 'int' }) // Precio en centavos: 1000 = $10.00
  @ApiProperty({ example: 1000 })
  price: number;

  @Column({ type: 'int', default: 0 })
  @ApiProperty({ example: 80 })
  stock: number;

  @CreateDateColumn()
  @ApiProperty({ example: '2026-04-07T11:44:31.835Z' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ example: '2026-04-07T11:44:31.835Z' })
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;
}
