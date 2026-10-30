import { prisma, type Db } from '../config/database.js';
import type { Prisma } from '../generated/prisma/client.js';

export const tarifaRepository = {
  listarDeCancha: (canchaId: string, db: Db = prisma) =>
    db.tarifa.findMany({
      where: { canchaId },
      orderBy: [{ tipoDia: 'asc' }, { horaInicio: 'asc' }, { vigenteDesde: 'desc' }],
    }),

  buscarPorId: (id: string, db: Db = prisma) => db.tarifa.findUnique({ where: { id } }),

  crear: (datos: Prisma.TarifaUncheckedCreateInput, db: Db = prisma) => db.tarifa.create({ data: datos }),

  actualizar: (id: string, cambios: Prisma.TarifaUncheckedUpdateInput, db: Db = prisma) =>
    db.tarifa.update({ where: { id }, data: cambios }),

  eliminar: (id: string, db: Db = prisma) => db.tarifa.delete({ where: { id } }),
};
