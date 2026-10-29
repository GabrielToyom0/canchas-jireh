import type { Sede } from '../generated/prisma/client.js';

export type { Sede };

/** Lo que necesitan las reglas de horario (RN-02). */
export type HorarioSede = Pick<Sede, 'horaApertura' | 'horaCierre'>;
