import type { Bloqueo } from '../generated/prisma/client.js';

export type { Bloqueo };

/** Rango de tiempo en UTC, fin exclusivo. */
export interface Intervalo {
  inicio: Date;
  fin: Date;
}
