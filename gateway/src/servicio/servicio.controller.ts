import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ServicioGatewayService } from './servicio.service';
import { ComentarioGatewayService } from '../comentario/comentario.service';

@Controller('servicios')
export class ServicioGatewayController {

  constructor(
    private servicio: ServicioGatewayService,
    private comentario: ComentarioGatewayService
  ) {}

  @Post()
  crear(@Body() body: any) {
    return this.servicio.crear(body);
  }

  @Get()
  listar() {
    return this.servicio.listar();
  }

  @Get(':id')
  obtener(@Param('id') id: number) {
    return this.servicio.obtener(id);
  }

  // 🔥 CONSULTA DISTRIBUIDA (nivel avanzado)
  @Get(':id/comentarios')
  async servicioConComentarios(@Param('id') id: number) {
    const servicio = await this.servicio.obtener(id);
    const comentarios = await this.comentario.listarPorServicio(id);


    return {
      servicio,
      comentarios,
    };
  }
}
