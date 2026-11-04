import { prisma, type Db } from '../config/database.js';
import type { ReglaReembolso } from '../services/reglas/reembolso.js';

export const politicaRepository = {
  deSede: (sedeId: string, db: Db = prisma) =>
    db.politicaCancelacion.findMany({ where: { sedeId }, orderBy: { horasAntes: 'desc' } }),

  /** Reemplaza todas las reglas de la sede de una vez. */
  reemplazar: (sedeId: string, reglas: ReglaReembolso[]) =>
    prisma.$transaction([
      prisma.politicaCancelacion.deleteMany({ where: { sedeId } }),
      prisma.politicaCancelacion.createMany({ data: reglas.map((r) => ({ ...r, sedeId })) }),
    ]),
};
