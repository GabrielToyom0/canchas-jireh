import { z } from 'zod';
import { minutosDeHora } from '../utils/fechas.js';
import { fecha, horaExacta } from './comun.validator.js';

// RF-06 / HU-11: bloqueo de horario dentro de un día.
export const esquemaBloqueo = z
  .object({
    canchaId: z.uuid('Cancha inválida'),
    fecha,
    horaInicio: horaExacta,
    horaFin: horaExacta,
    motivo: z.string().trim().min(3).max(200),
  })
  .refine((d) => minutosDeHora(d.horaInicio) < minutosDeHora(d.horaFin), {
    message: 'La hora de inicio debe ser antes del fin',
    path: ['horaFin'],
  });

export const esquemaFiltroBloqueos = z.object({ sedeId: z.uuid().optional(), desde: fecha, hasta: fecha });
