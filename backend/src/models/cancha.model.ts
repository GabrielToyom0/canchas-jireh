import type { Bloqueo, Cancha, Sede, Tarifa } from '../generated/prisma/client.js';

export type { Cancha };

/** Cancha con todo lo que se necesita para calcular disponibilidad y precio. */
export type CanchaConDetalle = Cancha & { sede: Sede; tarifas: Tarifa[]; bloqueos: Bloqueo[] };
