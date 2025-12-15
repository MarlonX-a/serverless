import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

serve(async (req) => {
  const payload = await req.json();

  const token = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const chatId = Deno.env.get('TELEGRAM_CHAT_ID');

  let mensaje = '📢 Evento recibido';

  if (payload.event === 'servicio.creado') {
    mensaje = `
🆕 *Nuevo Servicio Creado*
📌 ID: ${payload.data.servicio_id}
📝 Nombre: ${payload.data.nombre_servicio}
⏱ Duración: ${payload.data.duracion} minutos
    `;
  }

  if (payload.event === 'comentario.creado') {
    mensaje = `
💬 *Nuevo Comentario*
📌 Servicio ID: ${payload.data.servicio_id}
🧑 Cliente ID: ${payload.data.cliente_id}
📝 ${payload.data.texto}
    `;
  }

  // Enviar mensaje a Telegram
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: mensaje,
      parse_mode: 'Markdown',
    }),
  });

  return new Response('Notificación enviada a Telegram', { status: 200 });
});
