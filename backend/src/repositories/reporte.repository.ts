import { prisma, type Db } from '../config/database.js';

// Consultas de solo lectura para los reportes (HU-12).
export const reporteRepository = {
  sedesConCanchasActivas: (sedeId: string | undefined, db: Db = prisma) =>
    db.sede.findMany({
      where: sedeId ? { id: sedeId } : undefined,
      include: { canchas: { where: { activa: true }, select: { id: true } } },
      orderBy: { nombre: 'asc' },
    }),

  reservasQueInician: (sedeIds: string[], desde: Date, hasta: Date, db: Db = prisma) =>
    db.reserva.findMany({
      where: { sedeId: { in: sedeIds }, inicio: { gte: desde, lt: hasta } },
      select: { sedeId: true, estado: true, inicio: true, fin: true },
    }),

  pagosCobrados: (sedeId: string | undefined, desde: Date, hasta: Date, db: Db = prisma) =>
    db.pago.findMany({
      where: {
        estado: { in: ['CONFIRMADO', 'REEMBOLSADO'] },
        confirmadoEn: { gte: desde, lt: hasta },
        reserva: sedeId ? { sedeId } : undefined,
      },
      select: { metodo: true, monto: true, reserva: { select: { sedeId: true } } },
    }),

  reembolsos: (sedeId: string | undefined, desde: Date, hasta: Date, db: Db = prisma) =>
    db.reembolso.findMany({
      where: { creadoEn: { gte: desde, lt: hasta }, pago: { reserva: sedeId ? { sedeId } : undefined } },
      select: { monto: true, pago: { select: { reserva: { select: { sedeId: true } } } } },
    }),
};
