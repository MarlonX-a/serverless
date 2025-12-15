import { Injectable } from '@nestjs/common';
import { ClientProxyFactory, ClientProxy, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ComentarioGatewayService {

  private comentarioClient: ClientProxy;

  constructor(private config: ConfigService) {
    this.comentarioClient = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [this.config.get('RABBITMQ_URL')],
        queue: this.config.get('RABBITMQ_QUEUE_COMENTARIO'),
        queueOptions: { durable: true },
      },
    });
  }

  crearComentario(data: any) {
    return this.comentarioClient.send('comentario.crear', data);
  }

  listar() {
    return this.comentarioClient.send('comentario.listar', {});
  }

  obtener(id: number) {
    return this.comentarioClient.send('comentario.obtener', { id });
  }

  listarPorServicio(servicio_id: number) {
    return this.comentarioClient.send('comentario.listar_por_servicio', { servicio_id });
  }
}
