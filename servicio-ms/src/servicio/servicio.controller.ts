import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, EventPattern } from '@nestjs/microservices';
import { ServicioService } from './servicio.service';

@Controller()
export class ServicioController {
  constructor(private readonly servicioService: ServicioService) {}

  @MessagePattern('servicio.validar')
  async validarServicio(@Payload() data: any) {
    const existe = await this.servicioService.existeServicio(data.servicio_id);

    return {
      servicio_id: data.servicio_id,
      existe,
    };
  }

  @MessagePattern('servicio.crear')
  async crear(@Payload() data: any) {
    return this.servicioService.crearServicio(data);
  }

  @MessagePattern('servicio.listar')
  async listar() {
    return this.servicioService.obtenerServicios();
  }

  @MessagePattern('servicio.obtener')
  async obtener(@Payload() data: any) {
    return this.servicioService.obtenerServicioPorId(data.id);
  }

  @EventPattern('comentario.creado')
  alComentarioCreado(@Payload() data: any) {
    // Evento: comentario creado en comentario-ms
    // Aquí puedes actualizar estadísticas del servicio, cache, etc.
    console.log('📢 Evento recibido: comentario.creado', data);
    return { procesado: true };
  }
}

