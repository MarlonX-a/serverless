import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Servicio } from './servicio.entity';
import { ServicioService } from './servicio.service';
import { ServicioController } from './servicio.controller';


@Module({
  imports: [TypeOrmModule.forFeature([Servicio])],
  providers: [ServicioService],
  controllers: [ServicioController],
  exports: [ServicioService],
})
export class ServicioModule {}