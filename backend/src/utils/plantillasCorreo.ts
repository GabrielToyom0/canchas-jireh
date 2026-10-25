import type { TipoNotificacion } from '../models/enums.js';
import { ZONA_HORARIA } from './fechas.js';

export interface Correo {
  asunto: string;
  html: string;
  texto: string;
}

/** Datos de la reserva que necesita cualquier correo. */
export interface DatosCorreo {
  nombre: string;
  canchaNombre: string;
  sedeNombre: string;
  inicio: Date;
  fin: Date;
  precioTotal: number;
  motivo?: string;
  porcentajeReembolso?: number;
  montoReembolsado?: number;
}

const moneda = new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' });
const fechaHora = new Intl.DateTimeFormat('es-GT', {
  timeZone: ZONA_HORARIA,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});
const hora = new Intl.DateTimeFormat('es-GT', {
  timeZone: ZONA_HORARIA,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** Evita inyectar HTML con datos del usuario (OWASP: XSS en correos). */
const escapar = (texto: string) =>
  texto.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const detalleReserva = (d: DatosCorreo) =>
  `${d.canchaNombre} — ${d.sedeNombre}, ${fechaHora.format(d.inicio)} a ${hora.format(d.fin)}`;

function armar(nombre: string, asunto: string, parrafos: string[], enlace: { texto: string; url: string }): Correo {
  const html = `<!doctype html>
<html lang="es"><body style="margin:0;background:#f4f6f5;font-family:Arial,Helvetica,sans-serif;color:#1d2b24">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:8px">
      <tr><td style="background:#14532d;color:#fff;padding:20px 24px;border-radius:8px 8px 0 0;font-size:20px;font-weight:bold">Canchas Jireh</td></tr>
      <tr><td style="padding:24px;font-size:16px;line-height:1.5">
        <p>Hola ${escapar(nombre)},</p>
        ${parrafos.map((p) => `<p>${escapar(p)}</p>`).join('\n        ')}
        <p><a href="${enlace.url}" style="display:inline-block;background:#15803d;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none">${escapar(enlace.texto)}</a></p>
      </td></tr>
      <tr><td style="padding:16px 24px;font-size:12px;color:#5b6b63">Este es un correo automático, por favor no responda.</td></tr>
    </table>
  </td></tr></table>
</body></html>`;
  const texto = [`Hola ${nombre},`, ...parrafos, `${enlace.texto}: ${enlace.url}`].join('\n\n');
  return { asunto, html, texto };
}

/** Correo de cada aviso del sistema (HU-05, RF-15). */
export function correoPara(tipo: TipoNotificacion, d: DatosCorreo, appUrl: string): Correo {
  const misReservas = { texto: 'Ver mis reservas', url: `${appUrl}/mis-reservas` };
  switch (tipo) {
    case 'RESERVA_CONFIRMADA':
      return armar(
        d.nombre,
        'Tu reserva está confirmada',
        [
          `Tu reserva quedó confirmada: ${detalleReserva(d)}.`,
          `Total pagado: ${moneda.format(d.precioTotal)}.`,
          'Te esperamos. Si necesitas cancelar, hazlo desde la plataforma para conocer tu reembolso.',
        ],
        misReservas,
      );
    case 'RESERVA_CANCELADA':
      return armar(
        d.nombre,
        'Tu reserva fue cancelada',
        [
          `La reserva ${detalleReserva(d)} fue cancelada.`,
          `Motivo: ${d.motivo ?? 'sin indicar'}.`,
          (d.porcentajeReembolso ?? 0) > 0
            ? `Si la reserva estaba pagada, se reembolsará el ${d.porcentajeReembolso} % del monto.`
            : 'Según la política de cancelación, esta cancelación no tiene reembolso.',
        ],
        misReservas,
      );
    case 'RESERVA_EXPIRADA':
      return armar(
        d.nombre,
        'Tu reserva expiró',
        [
          `No recibimos el pago a tiempo, así que liberamos el horario: ${detalleReserva(d)}.`,
          'Si aún te interesa, puedes volver a reservarlo si sigue disponible.',
        ],
        { texto: 'Buscar horarios', url: appUrl },
      );
    case 'RESERVA_RECORDATORIO':
      return armar(
        d.nombre,
        'Recordatorio de tu reserva',
        [`Te recordamos tu reserva: ${detalleReserva(d)}.`, 'Llega unos minutos antes. ¡Buen partido!'],
        misReservas,
      );
    case 'PAGO_REEMBOLSADO':
      return armar(
        d.nombre,
        'Reembolso registrado',
        [
          `Registramos un reembolso de ${moneda.format(d.montoReembolsado ?? 0)} (${d.porcentajeReembolso ?? 0} % de ${moneda.format(d.precioTotal)}).`,
          'El tiempo de acreditación depende de tu método de pago.',
        ],
        { texto: 'Ver mis pagos', url: `${appUrl}/mis-pagos` },
      );
  }
}
