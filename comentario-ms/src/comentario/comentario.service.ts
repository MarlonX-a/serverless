import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comentario } from './comentario.entity';
import { Idempotencia } from './idempotencia.entity';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import axios from 'axios';


@Injectable()
export class ComentarioService {

  private servicioClient: ClientProxy;

  constructor(
    @InjectRepository(Comentario)
    private comentarioRepo: Repository<Comentario>,

    @InjectRepository(Idempotencia)
    private idemRepo: Repository<Idempotencia>,

    private config: ConfigService,
  ) {
    // Cliente para comunicar con ServicioMS
    this.servicioClient = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [this.config.get('RABBITMQ_URL')],
        queue: this.config.get('RABBITMQ_QUEUE_SERVICIO'),
        queueOptions: { durable: true },
      },
    });
  }

  private generarFirma(payload: any): string {
    if (!process.env.WEBHOOK_SECRET) {
        throw new Error('WEBHOOK_SECRET no está definido en las variables de entorno');
      }

    return crypto
      .createHmac('sha256', process.env.WEBHOOK_SECRET)
      .update(JSON.stringify(payload))
      .digest('hex');
  }

  // 1. ¿La clave idempotente ya existe?
  async esDuplicado(key: string): Promise<boolean> {
    const existe = await this.idemRepo.findOne({
      where: { idempotency_key: key },
    });
    return !!existe;
  }

  // 2. Guardar clave idempotente para evitar repetir efectos
  async guardarClave(key: string) {
    const idem = this.idemRepo.create({
      idempotency_key: key,
      procesado_en: new Date().toISOString(),
    });
    await this.idemRepo.save(idem);
  }

  // 3. Validar servicio en ServicioMS (RabbitMQ)
  async validarServicio(servicio_id: number): Promise<{ servicio_id: number; existe: boolean }> {
    return this.servicioClient
      .send('servicio.validar', { servicio_id })
      .toPromise();
  }

  // 4. Crear comentario (flujo completo + idempotencia + validación + evento)
  async crearComentario(data: any): Promise<any> {
    //Idempotencia
    if (await this.esDuplicado(data.idempotency_key)) {
      return { mensaje: 'Comentario ignorado (duplicado)'};
    }

    //Validar servicio
    const validacion = await this.validarServicio(data.servicio_id);
    if (!validacion.existe) {
      throw new Error(`Servicio ${data.servicio_id} no existe`);
    }

    //Guardar comentario

    const comentario = this.comentarioRepo.create(data as Partial<Comentario>);
    const comentarioGuardado = await this.comentarioRepo.save(comentario);

    //Guardar clave idempotente
    await this.guardarClave(data.idempotency_key);


    //Emitir evento interno (RabbitMQ)
    await this.servicioClient.emit('comentario.creado', {
      comentario_id: comentarioGuardado.id,
      ...data,
    });

    //webhook externo
    const payload = {
      evento: 'comentario.creado',
      version: '1.0',
      idempotency_key: data.idempotency_key,
      timestamp: new Date().toISOString(),
      data: {
        comentario_id: comentarioGuardado.id,
        servicio_id: comentarioGuardado.servicio_id,
        cliente_id: comentarioGuardado.cliente_id,
        titulo: comentarioGuardado.titulo,
        texto: comentarioGuardado.texto,
      },
      metadata: {
        source: 'comentario-ms',
        environment: 'local',
      },
    };

    const signature = this.generarFirma(payload);

    try {

      if (!process.env.WEBHOOK_URL) {
        throw new Error('WEBHOOK_URL no está definido en las variables de entorno');
      }

      await axios.post(
        process.env.WEBHOOK_URL,
        payload,
        {
          headers: {
            'X-Signature': signature,
            'Content-Type': 'application/json',
          },
        },
      );
    } catch (error) {
      console.error('Error eviando webhook:', error.message);
    }

    return comentarioGuardado;
  }

  // 5. Listar todos los comentarios
  async listarComentarios() {
    return this.comentarioRepo.find();
  }

  // 6. Obtener comentario por ID
  async obtenerComentarioPorId(id: number) {
    return this.comentarioRepo.findOne({ where: { id } });
  }

  // 7. Listar comentarios por servicio_id
  async listarComentariosPorServicio(servicio_id: number) {
    return this.comentarioRepo.find({
      where: { servicio_id },
    });
  }
}
