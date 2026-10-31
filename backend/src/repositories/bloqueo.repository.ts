import { prisma, type Db } from '../config/database.js';
import type { Prisma } from '../generated/prisma/client.js';

export const bloqueoRepository = {
  /** Bloqueos que se cruzan con el rango, opcionalmente de una sola sede. */
  listar: (filtro: { sedeId?: string; desde: Date; hasta: Date }, db: Db = prisma) =>
    db.bloqueo.findMany({
      where: {
        cancha: filtro.sedeId ? { sedeId: filtro.sedeId } : undefined,
        inicio: { lt: filtro.hasta },
        fin: { gt: filtro.desde },
      },
      include: { cancha: { select: { id: true, nombre: true, sedeId: true } } },
      orderBy: { inicio: 'asc' },
    }),

  buscarSolapado: (canchaId: string, inicio: Date, fin: Date, db: Db = prisma) =>
    db.bloqueo.findFirst({ where: { canchaId, inicio: { lt: fin }, fin: { gt: inicio } } }),

  buscarConCancha: (id: string, db: Db = prisma) => db.bloqueo.findUnique({ where: { id }, include: { cancha: true } }),

  crear: (datos: Prisma.BloqueoUncheckedCreateInput, db: Db = prisma) => db.bloqueo.create({ data: datos }),

  eliminar: (id: string, db: Db = prisma) => db.bloqueo.delete({ where: { id } }),
};
