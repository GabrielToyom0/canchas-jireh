import { z } from 'zod';
import { ESTADOS_RESERVA } from '../models/enums.js';
import { fecha, hora } from './comun.validator.js';

// HU-03 / RF-08
export const esquemaNuevaReserva = z.object({
  canchaId: z.uuid('Cancha inválida'),
  fecha,
  horaInicio: hora,
  horas: z.coerce.number().int().min(1, 'Mínimo una hora').max(8, 'Máximo 8 horas'),
});

export const esquemaFiltroMisReservas = z.object({ estado: z.enum(ESTADOS_RESERVA).optional() });

// HU-09 / RF-13
export const esquemaCalendario = z.object({ sedeId: z.uuid('Seleccione una sede'), fecha });

// HU-06 / RF-10
export const esquemaCancelacion = z.object({
  motivo: z.string().trim().min(3, 'Indique el motivo').max(200).default('Cancelada por el cliente'),
});
