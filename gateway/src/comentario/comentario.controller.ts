import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { ComentarioGatewayService } from './comentario.service';
import { randomUUID } from 'crypto';

@Controller('comentarios')
export class ComentarioGatewayController {

  constructor(private comentario: ComentarioGatewayService) {}

  @Post()
  crear(@Body() body: any) {
    const payload = {
      idempotency_key: randomUUID(),
      fecha: new Date().toISOString(),
      ...body
    };
    return this.comentario.crearComentario(payload);
  }

  @Get()
  listar() {
    return this.comentario.listar();
  }

  @Get(':id')
  obtener(@Param('id') id: number) {
    return this.comentario.obtener(id);
  }
}
