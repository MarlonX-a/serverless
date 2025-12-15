import { Injectable } from '@nestjs/common';
import { ClientProxyFactory, ClientProxy, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ServicioGatewayService {
  private servicioClient: ClientProxy;

  constructor(private config: ConfigService) {
    this.servicioClient = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [this.config.get('RABBITMQ_URL')],
        queue: this.config.get('RABBITMQ_QUEUE_SERVICIO'),
        queueOptions: { durable: true }
      },
    });
  }

  crear(data: any) {
    return this.servicioClient.send('servicio.crear', data);
  }

  listar() {
    return this.servicioClient.send('servicio.listar', {});
  }

  obtener(id: number) {
    return this.servicioClient.send('servicio.obtener', { id });
  }
}
