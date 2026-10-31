import { z } from 'zod';
import { DEPORTES } from '../models/enums.js';

const camposCancha = {
  nombre: z.string().trim().min(1).max(100),
  deporte: z.enum(DEPORTES),
  superficie: z.string().trim().min(2).max(50),
  capacidad: z.coerce.number().int().min(1).max(100),
};

// RF-04
export const esquemaCancha = z.object({ sedeId: z.uuid('Sede inválida'), ...camposCancha });
export const esquemaCanchaParcial = z.object({ ...camposCancha, activa: z.boolean() }).partial();

export const esquemaFiltroCanchas = z.object({
  sedeId: z.uuid().optional(),
  deporte: z.enum(DEPORTES).optional(),
  incluirInactivas: z.stringbool().default(false),
});
