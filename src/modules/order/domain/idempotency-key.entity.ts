import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('idempotency-key')
export class IdempotencyKey {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  key: string;

  @Column({ type: 'text' })
  response: string;

  @Column({ type: 'int' })
  statusCode: number;

  @CreateDateColumn()
  createdAt: Date;
}
