import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

function generarFirma(payload: any, secret: string): string {
  const encoder = new TextEncoder();
  const key = encoder.encode(secret);
  const data = encoder.encode(JSON.stringify(payload));

  return crypto.subtle
    .importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    .then((cryptoKey) =>
      crypto.subtle.sign('HMAC', cryptoKey, data),
    )
    .then((signature) =>
      Array.from(new Uint8Array(signature))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join(''),
    );
}

serve(async (req) => {
  //  Leer firma
  const signatureHeader = req.headers.get('x-signature');
  if (!signatureHeader) {
    return new Response('Missing signature', { status: 401 });
  }

  //  Leer body
  const payload = await req.json();

  //  Recalcular firma
  const secret = Deno.env.get('WEBHOOK_SECRET');
  const expectedSignature = await generarFirma(payload, secret);

  //  Comparar firmas
  if (signatureHeader !== expectedSignature) {
    return new Response('Invalid signature', { status: 401 });
  }

  //  Conectar a Supabase
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  //  Idempotencia (NO duplicar)
  const { data: existing } = await supabase
    .from('webhook_events')
    .select('id')
    .eq('idempotency_key', payload.idempotency_key)
    .maybeSingle();

  if (existing) {
    return new Response('Duplicate event ignored', { status: 200 });
  }

  //  Guardar evento
  await supabase.from('webhook_events').insert({
    id: crypto.randomUUID(),
    event: payload.event,
    idempotency_key: payload.idempotency_key,
    payload,
  });

  return new Response('Event processed', { status: 200 });
});

