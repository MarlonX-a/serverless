import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Idempotencia {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  idempotency_key: string;

  @Column()
  procesado_en: string;
}
