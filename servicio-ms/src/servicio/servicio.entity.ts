import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Servicio {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre_servicio: string;

  @Column({ nullable: true })
  descripcion: string;

  @Column({ nullable: true })
  duracion: number; 

  @Column({ nullable: true })
  rating_promedio: number;

  @Column({ nullable: true })
  proveedor_id: number;

  @Column({ nullable: true })
  categoria_id: number;
}
