import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  sku: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'int' }) // Precio en centavos: 1000 = $10.00
  price: number;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @UpdateDateColumn()
  updatedAt: Date;
}
