import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Servicio } from './servicio.entity';
import * as crypto from 'crypto';
import axios from 'axios';


@Injectable()
export class ServicioService {
  constructor(
    @InjectRepository(Servicio)
    private repo: Repository<Servicio>,
  ) {}

  private generarFirma(payload: any): string {

    if (!process.env.WEBHOOK_SECRET) {
        throw new Error('WEBHOOK_SECRET no está definido en las variables de entorno');
    }

    return crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');
  }

  async existeServicio(id: number): Promise<boolean> {
    const count = await this.repo.count({ where: { id } });
    return count > 0;
  }

  async crearServicio(data: Partial<Servicio>) {
    if (!data.nombre_servicio) {
      throw new BadRequestException('El nombre del servicio es obligatorio');
    }

    //Guardar servicio en la BD
    const servicio = this.repo.create(data);
    const servicioGuardado = await this.repo.save(servicio);

    //Payload para el webhook
    const payload = {
      event: 'servicio_creado',
      version: '1.0',
      idempotency_key: `servicio-${servicioGuardado.id}-creado`,
      timestamp: new Date().toISOString(),
      data: {
        servicio_id: servicioGuardado.id,
        nombre_servicio: servicioGuardado.nombre_servicio,
        descripcion: servicioGuardado.descripcion,
        duracion: servicioGuardado.duracion,
        proveedor_id: servicioGuardado.proveedor_id,
        categoria_id: servicioGuardado.categoria_id,
      },
      metadata: {
        sourse: 'ServicioMS',
        environment: 'local',
      },
    };

    //Firmar payload
    const signature = this.generarFirma(payload);

    //Enviar webhook a supabase edge function

    try {

      if (!process.env.WEBHOOK_URL) {
        throw new Error('WEBHOOK_URL no está definido en las variables de entorno');
      }

      await axios.post(
        process.env.WEBHOOK_URL,
        payload,
        {
          headers: {
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'X-Signature': signature,
            'Content-Type': 'application/json',
          },
        },
      );
    } catch (error) {
      console.error('Error enviando webhook servicio.creado', error.message);
    }

    return servicioGuardado;

  }

  async obtenerServicios() {
    return this.repo.find();
  }

  async obtenerServicioPorId(id: number) {
    return this.repo.findOne({ where: { id } });
  }

}
