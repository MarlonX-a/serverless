import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ComentarioService } from './comentario.service';

@Controller()
export class ComentarioController {
  constructor(private readonly comentarioService: ComentarioService) {}

  @MessagePattern('comentario.crear')
  async crear(@Payload() data: any) {
    return this.comentarioService.crearComentario(data);
  }

  @MessagePattern('comentario.listar')
  async listar() {
    return this.comentarioService.listarComentarios();
  }

  @MessagePattern('comentario.obtener')
  async obtener(@Payload() data: any) {
    return this.comentarioService.obtenerComentarioPorId(data.id);
  }

  @MessagePattern('comentario.listar_por_servicio')
  async listarPorServicio(@Payload() data: any) {
    return this.comentarioService.listarComentariosPorServicio(data.servicio_id);
  }
}

