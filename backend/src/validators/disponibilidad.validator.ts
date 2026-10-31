import { z } from 'zod';
import { DEPORTES } from '../models/enums.js';
import { fecha } from './comun.validator.js';

// HU-02 / RF-07
export const esquemaDisponibilidad = z.object({
  sedeId: z.uuid('Seleccione una sede'),
  fecha,
  deporte: z.enum(DEPORTES).optional(),
});
