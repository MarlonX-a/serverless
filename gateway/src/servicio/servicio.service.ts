import { Injectable } from '@nestjs/common';
import { ClientProxyFactory, ClientProxy, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class ServicioGatewayService {
  private servicioClient: ClientProxy;

  constructor(private config: ConfigService) {
    const rmqUrl = this.config.get<string>('RABBITMQ_URL');
    const queueServicio = this.config.get<string>('RABBITMQ_QUEUE_SERVICIO');

    console.log('🐰 [Gateway] RABBITMQ_URL:', rmqUrl);
    console.log('📦 [Gateway] RABBITMQ_QUEUE_SERVICIO:', queueServicio);

    if (!rmqUrl || !queueServicio) {
      throw new Error('❌ RabbitMQ envs NO cargados en Gateway');
    }

    this.servicioClient = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [rmqUrl],
        queue: queueServicio,
        queueOptions: { durable: true },
      },
    });
  }

  async crear(data: any) {
    console.log('➡️ [Gateway] Enviando servicio.crear', data);

    return await lastValueFrom(
      this.servicioClient.send('servicio.crear', data)
    );
  }

  async listar() {
    console.log('➡️ [Gateway] Enviando servicio.listar');

    return await lastValueFrom(
      this.servicioClient.send('servicio.listar', {})
    );
  }

  async obtener(id: number) {
    console.log('➡️ [Gateway] Enviando servicio.obtener', id);

    return await lastValueFrom(
      this.servicioClient.send('servicio.obtener', { id })
    );
  }
}
