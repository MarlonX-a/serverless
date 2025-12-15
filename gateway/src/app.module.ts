import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServicioGatewayController } from './servicio/servicio.controller';
import { ServicioGatewayService } from './servicio/servicio.service';
import { ComentarioGatewayService } from './comentario/comentario.service';
import { ComentarioGatewayController } from './comentario/comentario.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [
    ServicioGatewayController,
    ComentarioGatewayController,
  ],
  providers: [
    ServicioGatewayService,
    ComentarioGatewayService,
  ],
})
export class AppModule {}
