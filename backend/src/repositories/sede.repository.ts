import { prisma, type Db } from '../config/database.js';
import type { Prisma } from '../generated/prisma/client.js';

export const sedeRepository = {
  listar: (soloActivas: boolean, db: Db = prisma) =>
    db.sede.findMany({ where: soloActivas ? { activa: true } : undefined, orderBy: { nombre: 'asc' } }),

  buscarPorId: (id: string, db: Db = prisma) => db.sede.findUnique({ where: { id } }),

  buscarConCanchasActivas: (id: string, db: Db = prisma) =>
    db.sede.findUnique({
      where: { id },
      include: { canchas: { where: { activa: true }, orderBy: { nombre: 'asc' } } },
    }),

  buscarPorNombre: (nombre: string, db: Db = prisma) => db.sede.findUnique({ where: { nombre } }),

  crear: (datos: Prisma.SedeCreateInput, db: Db = prisma) => db.sede.create({ data: datos }),

  actualizar: (id: string, cambios: Prisma.SedeUpdateInput, db: Db = prisma) =>
    db.sede.update({ where: { id }, data: cambios }),
};
