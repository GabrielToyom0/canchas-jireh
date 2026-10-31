import type { Prisma, Reserva } from '../generated/prisma/client.js';

export type { Reserva };

/** Relaciones que acompañan a una reserva en las respuestas (nombres para historial y calendario). */
export const detalleReserva = {
  usuario: { select: { nombre: true, correo: true } },
  cancha: { select: { nombre: true, deporte: true } },
  sede: { select: { nombre: true } },
} satisfies Prisma.ReservaInclude;

export type ReservaConDetalle = Prisma.ReservaGetPayload<{ include: typeof detalleReserva }>;

export interface NuevaReserva {
  canchaId: string;
  fecha: string;
  horaInicio: string;
  horas: number;
}

/** Reserva en el formato de la API. */
export function reservaJson(r: ReservaConDetalle) {
  const { usuario, cancha, sede, ...datos } = r;
  return {
    ...datos,
    precioTotal: Number(r.precioTotal),
    usuarioNombre: usuario.nombre,
    canchaNombre: cancha.nombre,
    deporte: cancha.deporte,
    sedeNombre: sede.nombre,
  };
}
