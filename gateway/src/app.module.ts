import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ComentarioModule } from './comentario/comentario.module';
import { ServicioModule } from './servicio/servicio.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ComentarioModule,
    ServicioModule,
  ],
})
export class AppModule {}

