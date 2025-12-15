import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [config.get('RABBITMQ_URL')],
      queue: config.get('RABBITMQ_QUEUE_COMENTARIO'),
      queueOptions: { durable: true },
    }
  });

  await app.startAllMicroservices();
  await app.listen(config.get<number>('PORT', 3002), '0.0.0.0');

  console.log('ComentarioMS corriendo en puerto', config.get('PORT'));
}
bootstrap();
