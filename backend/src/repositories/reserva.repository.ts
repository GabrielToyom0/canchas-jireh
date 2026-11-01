import { prisma, type Db } from '../config/database.js';
import type { Prisma } from '../generated/prisma/client.js';
import { ESTADOS_RESERVA_ACTIVOS, type EstadoReserva } from '../models/enums.js';
import { detalleReserva } from '../models/reserva.model.js';

const activos = { in: ESTADOS_RESERVA_ACTIVOS };

type CambiosReserva = Pick<
  Prisma.ReservaUncheckedUpdateManyInput,
  'estado' | 'expiraEn' | 'canceladaEn' | 'motivoCancelacion' | 'porcentajeReembolso' | 'recordatorioEnviado'
>;

export const reservaRepository = {
  buscarPorId: (id: string, db: Db = prisma) => db.reserva.findUnique({ where: { id }, include: detalleReserva }),

  /**
   * RF-09: cuenta las reservas activas que se cruzan con el rango y BLOQUEA ese rango
   * (UPDLOCK + HOLDLOCK) hasta que termine la transacción. Dos solicitudes simultáneas
   * por el mismo horario quedan en fila: la segunda ve la reserva de la primera.
   */
  contarActivasConBloqueo: async (canchaId: string, inicio: Date, fin: Date, tx: Prisma.TransactionClient) => {
    const [{ ocupadas }] = await tx.$queryRaw<{ ocupadas: number }[]>`
      SELECT COUNT(*) AS ocupadas
      FROM [dbo].[Reserva] WITH (UPDLOCK, HOLDLOCK)
      WHERE canchaId = ${canchaId}
        AND estado IN (N'PENDIENTE', N'CONFIRMADA')
        AND inicio < ${fin} AND fin > ${inicio}`;
    return Number(ocupadas);
  },

  contarActivas: (canchaId: string, inicio: Date, fin: Date, db: Db = prisma) =>
    db.reserva.count({ where: { canchaId, estado: activos, inicio: { lt: fin }, fin: { gt: inicio } } }),

  crear: (datos: Prisma.ReservaUncheckedCreateInput, db: Db = prisma) =>
    db.reserva.create({ data: datos, include: detalleReserva }),

  /**
   * Cambia el estado solo si la reserva sigue en uno de los estados `desde`.
   * Devuelve false si otro proceso la cambió antes (evita carreras sin bloquear la tabla).
   */
  transicionar: async (id: string, desde: EstadoReserva[], cambios: CambiosReserva, db: Db = prisma) => {
    const { count } = await db.reserva.updateMany({ where: { id, estado: { in: desde } }, data: cambios });
    return count > 0;
  },

  /** RN-04 / RN-08: un pago en verificación detiene el plazo de pago. */
  suspenderExpiracion: async (id: string, db: Db = prisma) =>
    (await db.reserva.updateMany({ where: { id, estado: 'PENDIENTE' }, data: { expiraEn: null } })).count > 0,

  /** Si el pago se rechaza, la reserva vuelve a tener plazo para pagar. */
  reanudarExpiracion: (id: string, expiraEn: Date, db: Db = prisma) =>
    db.reserva.updateMany({ where: { id, estado: 'PENDIENTE', expiraEn: null }, data: { expiraEn } }),

  /** RN-04: PENDIENTE → EXPIRADA solo si el plazo ya venció. */
  expirarSiVencida: async (id: string, ahora: Date, db: Db = prisma) =>
    (
      await db.reserva.updateMany({
        where: { id, estado: 'PENDIENTE', expiraEn: { lt: ahora } },
        data: { estado: 'EXPIRADA' },
      })
    ).count > 0,

  listarDeUsuario: (usuarioId: string, estado?: EstadoReserva, db: Db = prisma) =>
    db.reserva.findMany({
      where: { usuarioId, estado },
      include: detalleReserva,
      orderBy: { inicio: 'desc' },
      take: 200,
    }),

  calendario: (sedeId: string, desde: Date, hasta: Date, db: Db = prisma) =>
    db.reserva.findMany({
      where: { sedeId, inicio: { lt: hasta }, fin: { gt: desde }, estado: { not: 'EXPIRADA' } },
      include: detalleReserva,
      orderBy: [{ cancha: { nombre: 'asc' } }, { inicio: 'asc' }],
    }),

  /** Reservas activas de varias canchas que se cruzan con el rango (disponibilidad). */
  activasEnCanchas: (canchaIds: string[], desde: Date, hasta: Date, db: Db = prisma) =>
    db.reserva.findMany({
      where: { canchaId: { in: canchaIds }, estado: activos, inicio: { lt: hasta }, fin: { gt: desde } },
      select: { canchaId: true, inicio: true, fin: true },
    }),

  // ── Consultas del programador de tareas ──

  pendientesVencidas: (ahora: Date, db: Db = prisma) =>
    db.reserva.findMany({
      where: { estado: 'PENDIENTE', expiraEn: { lt: ahora } },
      select: { id: true },
      take: 100,
    }),

  completarTerminadas: async (ahora: Date, db: Db = prisma) =>
    (
      await db.reserva.updateMany({
        where: { estado: 'CONFIRMADA', fin: { lt: ahora } },
        data: { estado: 'COMPLETADA' },
      })
    ).count,

  porRecordar: (ahora: Date, limite: Date, db: Db = prisma) =>
    db.reserva.findMany({
      where: { estado: 'CONFIRMADA', recordatorioEnviado: false, inicio: { gt: ahora, lte: limite } },
      select: { id: true },
      take: 100,
    }),
};
