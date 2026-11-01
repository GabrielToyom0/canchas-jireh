import { prisma, type Db } from '../config/database.js';
import { env } from '../config/env.js';
import type { TipoNotificacion } from '../models/enums.js';
import { notificacionRepository } from '../repositories/notificacion.repository.js';
import { reservaRepository } from '../repositories/reserva.repository.js';
import { enviarCorreo } from '../utils/correo.js';
import { noEncontrado } from '../utils/errores.js';
import { logger } from '../utils/logger.js';
import { correoPara, type DatosCorreo } from '../utils/plantillasCorreo.js';

type DatosExtra = Pick<DatosCorreo, 'motivo' | 'porcentajeReembolso' | 'montoReembolsado'>;

export const notificacionService = {
  /**
   * OE4 / RF-15: deja el correo en cola (estado PENDIENTE). Se llama dentro de la misma
   * transacción que cambia la reserva: si el cambio se revierte, el correo tampoco existe.
   */
  async encolar(tipo: TipoNotificacion, reservaId: string, extra: DatosExtra = {}, db: Db = prisma): Promise<void> {
    const reserva = await reservaRepository.buscarPorId(reservaId, db);
    if (!reserva) throw noEncontrado('Reserva');
    const correo = correoPara(
      tipo,
      {
        nombre: reserva.usuario.nombre,
        canchaNombre: reserva.cancha.nombre,
        sedeNombre: reserva.sede.nombre,
        inicio: reserva.inicio,
        fin: reserva.fin,
        precioTotal: Number(reserva.precioTotal),
        ...extra,
      },
      env.APP_URL,
    );
    await notificacionRepository.encolar(
      {
        usuarioId: reserva.usuarioId,
        reservaId,
        tipo,
        destinatario: reserva.usuario.correo,
        asunto: correo.asunto,
        cuerpoHtml: correo.html,
        cuerpoTexto: correo.texto,
      },
      db,
    );
  },

  /** Lo ejecuta el programador: envía los correos en cola y reintenta los fallidos. */
  async enviarPendientes(cantidad = 20): Promise<number> {
    const pendientes = await notificacionRepository.porEnviar(cantidad);
    let enviados = 0;
    for (const n of pendientes) {
      try {
        await enviarCorreo({ para: n.destinatario, asunto: n.asunto, html: n.cuerpoHtml, texto: n.cuerpoTexto });
        await notificacionRepository.marcarEnviada(n.id);
        enviados++;
      } catch (err) {
        await notificacionRepository.marcarFallida(n.id, (err as Error).message);
        logger.warn({ notificacionId: n.id, err: (err as Error).message }, 'No se pudo enviar el correo');
      }
    }
    return enviados;
  },

  misNotificaciones: (usuarioId: string) => notificacionRepository.listarDeUsuario(usuarioId),
};
