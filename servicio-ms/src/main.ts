import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [config.get('RABBITMQ_URL')],
      queue: config.get('RABBITMQ_QUEUE_SERVICIO'),
      queueOptions: { durable: true },
    },
  })
  await app.startAllMicroservices();
  await app.listen(config.get<number>('PORT', 3001), '0.0.0.0');

  console.log('ServicioMS corriendo en puerto', config.get('PORT'));
}
bootstrap();
