import { prisma, type Db } from '../config/database.js';
import type { Prisma } from '../generated/prisma/client.js';
import type { CanchaConDetalle } from '../models/cancha.model.js';
import type { Deporte } from '../models/enums.js';

/** Tarifas y bloqueos que se cruzan con el rango: lo necesario para disponibilidad y precio. */
const detalleEnRango = (desde: Date, hasta: Date) =>
  ({
    sede: true,
    tarifas: true,
    bloqueos: { where: { inicio: { lt: hasta }, fin: { gt: desde } }, orderBy: { inicio: 'asc' } },
  }) satisfies Prisma.CanchaInclude;

interface FiltroCanchas {
  sedeId?: string;
  deporte?: Deporte;
  /** false = solo canchas activas de sedes activas */
  incluirInactivas: boolean;
}

export const canchaRepository = {
  listar: (filtros: FiltroCanchas, db: Db = prisma) =>
    db.cancha.findMany({
      where: {
        sedeId: filtros.sedeId,
        deporte: filtros.deporte,
        ...(filtros.incluirInactivas ? {} : { activa: true, sede: { activa: true } }),
      },
      include: { sede: { select: { id: true, nombre: true } } },
      orderBy: [{ sede: { nombre: 'asc' } }, { nombre: 'asc' }],
    }),

  buscarPorId: (id: string, db: Db = prisma) => db.cancha.findUnique({ where: { id } }),

  buscarConSede: (id: string, db: Db = prisma) => db.cancha.findUnique({ where: { id }, include: { sede: true } }),

  buscarPorNombre: (sedeId: string, nombre: string, db: Db = prisma) =>
    db.cancha.findFirst({ where: { sedeId, nombre } }),

  crear: (datos: Prisma.CanchaUncheckedCreateInput, db: Db = prisma) => db.cancha.create({ data: datos }),

  actualizar: (id: string, cambios: Prisma.CanchaUncheckedUpdateInput, db: Db = prisma) =>
    db.cancha.update({ where: { id }, data: cambios }),

  /** Una cancha con sede, tarifas y bloqueos del rango (cálculo de precio al reservar). */
  conDetalle: (id: string, desde: Date, hasta: Date, db: Db = prisma): Promise<CanchaConDetalle | null> =>
    db.cancha.findUnique({ where: { id }, include: detalleEnRango(desde, hasta) }),

  /** Canchas activas de una sede con su detalle del rango (cálculo de disponibilidad). */
  deSedeConDetalle: (
    sedeId: string,
    desde: Date,
    hasta: Date,
    deporte?: Deporte,
    db: Db = prisma,
  ): Promise<CanchaConDetalle[]> =>
    db.cancha.findMany({
      where: { sedeId, activa: true, deporte },
      include: detalleEnRango(desde, hasta),
      orderBy: { nombre: 'asc' },
    }),
};
