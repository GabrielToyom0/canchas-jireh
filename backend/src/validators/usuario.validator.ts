import { z } from 'zod';
import { ROLES } from '../models/enums.js';
import { esquemaCorreo, esquemaNombre, esquemaPassword } from './auth.validator.js';
import { telefono } from './comun.validator.js';

export const esquemaFiltroUsuarios = z.object({ rol: z.enum(ROLES).optional() });

export const esquemaNuevoAdmin = z.object({
  nombre: esquemaNombre,
  correo: esquemaCorreo,
  telefono,
  password: esquemaPassword,
  sedeId: z.uuid('Sede inválida'),
});

export const esquemaActualizacionUsuario = z
  .object({
    activo: z.boolean().optional(),
    sedeId: z.uuid('Sede inválida').optional(),
  })
  .refine((d) => d.activo !== undefined || d.sedeId !== undefined, 'No hay cambios');
