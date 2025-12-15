import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Comentario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  servicio_id: number;

  @Column()
  cliente_id: number;

  @Column({ nullable: true })
  titulo: string;

  @Column()
  texto: string;

  @Column()
  fecha: string;

  @Column({ nullable: true })
  respuesta: string;
}
