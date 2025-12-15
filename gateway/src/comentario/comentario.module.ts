import { Module } from '@nestjs/common';
import { ComentarioGatewayService } from './comentario.service';
import { ComentarioGatewayController } from './comentario.controller';

@Module({
  controllers: [ComentarioGatewayController],
  providers: [ComentarioGatewayService],
  exports: [ComentarioGatewayService],
})
export class ComentarioModule {}
