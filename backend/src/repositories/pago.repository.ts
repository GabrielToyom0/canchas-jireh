import { prisma, type Db } from '../config/database.js';
import type { Prisma } from '../generated/prisma/client.js';

const activos = { in: ['PENDIENTE', 'CONFIRMADO'] };

export const pagoRepository = {
  /** Pago pendiente o confirmado de una reserva (solo puede haber uno: índice UX_Pago_ReservaActiva). */
  activoDeReserva: (reservaId: string, db: Db = prisma) => db.pago.findFirst({ where: { reservaId, estado: activos } }),

  activosDeReserva: (reservaId: string, db: Db = prisma) => db.pago.findMany({ where: { reservaId, estado: activos } }),

  crear: (datos: Prisma.PagoUncheckedCreateInput, db: Db = prisma) => db.pago.create({ data: datos }),

  buscarPorId: (id: string, db: Db = prisma) =>
    db.pago.findUnique({ where: { id }, include: { reserva: { select: { sedeId: true, usuarioId: true } } } }),

  listarDeUsuario: (usuarioId: string, db: Db = prisma) =>
    db.pago.findMany({
      where: { usuarioId },
      include: { reembolsos: true },
      orderBy: { creadoEn: 'desc' },
      take: 200,
    }),

  /** Pagos en verificación, de una sede o de todas (HU-10). */
  pendientes: (sedeId: string | undefined, db: Db = prisma) =>
    db.pago.findMany({
      where: { estado: 'PENDIENTE', reserva: sedeId ? { sedeId } : undefined },
      orderBy: { creadoEn: 'asc' },
    }),

  deReserva: (reservaId: string, db: Db = prisma) =>
    db.pago.findMany({ where: { reservaId }, include: { reembolsos: true }, orderBy: { creadoEn: 'desc' } }),

  /** Actualiza solo si el pago sigue PENDIENTE; devuelve false si alguien lo verificó antes. */
  actualizarPendiente: async (id: string, cambios: Prisma.PagoUncheckedUpdateManyInput, db: Db = prisma) =>
    (await db.pago.updateMany({ where: { id, estado: 'PENDIENTE' }, data: cambios })).count > 0,

  /** CONFIRMADO → REEMBOLSADO; devuelve false si ya no estaba confirmado. */
  marcarReembolsado: async (id: string, db: Db = prisma) =>
    (await db.pago.updateMany({ where: { id, estado: 'CONFIRMADO' }, data: { estado: 'REEMBOLSADO' } })).count > 0,

  crearReembolso: (datos: Prisma.ReembolsoUncheckedCreateInput, db: Db = prisma) =>
    db.reembolso.create({ data: datos }),
};
