import { Module } from '@nestjs/common';
import { ServicioGatewayService } from './servicio.service';
import { ServicioGatewayController } from './servicio.controller';
import { ComentarioModule } from '../comentario/comentario.module';

@Module({
  imports: [ComentarioModule],
  controllers: [ServicioGatewayController],
  providers: [ServicioGatewayService],
})
export class ServicioModule {}
