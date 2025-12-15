import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comentario } from './comentario.entity';
import { Idempotencia } from './idempotencia.entity';
import { ComentarioService } from './comentario.service';
import { ComentarioController } from './comentario.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Comentario, Idempotencia])],
  providers: [ComentarioService],
  controllers: [ComentarioController],
})
export class ComentarioModule {}
