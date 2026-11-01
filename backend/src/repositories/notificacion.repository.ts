import { prisma, type Db } from '../config/database.js';
import type { Prisma } from '../generated/prisma/client.js';
import { MAX_INTENTOS_CORREO, resumenNotificacion } from '../models/notificacion.model.js';

export const notificacionRepository = {
  /** Inserta el aviso PENDIENTE; si la reserva ya tenía ese aviso, no hace nada (idempotente). */
  encolar: (datos: Prisma.NotificacionUncheckedCreateInput, db: Db = prisma) =>
    db.notificacion.upsert({
      where: { reservaId_tipo: { reservaId: datos.reservaId, tipo: datos.tipo } },
      create: datos,
      update: {},
    }),

  /** Avisos por enviar: los nuevos y los que fallaron menos de MAX_INTENTOS_CORREO veces. */
  porEnviar: (cantidad: number, db: Db = prisma) =>
    db.notificacion.findMany({
      where: {
        OR: [{ estado: 'PENDIENTE' }, { estado: 'FALLIDA', intentos: { lt: MAX_INTENTOS_CORREO } }],
      },
      orderBy: { creadoEn: 'asc' },
      take: cantidad,
    }),

  marcarEnviada: (id: string, db: Db = prisma) =>
    db.notificacion.update({
      where: { id },
      data: { estado: 'ENVIADA', enviadaEn: new Date(), error: null, intentos: { increment: 1 } },
    }),

  marcarFallida: (id: string, error: string, db: Db = prisma) =>
    db.notificacion.update({
      where: { id },
      data: { estado: 'FALLIDA', error: error.slice(0, 500), intentos: { increment: 1 } },
    }),

  listarDeUsuario: (usuarioId: string, db: Db = prisma) =>
    db.notificacion.findMany({
      where: { usuarioId },
      select: resumenNotificacion,
      orderBy: { creadoEn: 'desc' },
      take: 50,
    }),
};
