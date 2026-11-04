import { z } from 'zod';
import { diasEntre } from '../utils/fechas.js';
import { rangoFechas } from './comun.validator.js';

// HU-12: el rango máximo de un reporte es de un año.
export const esquemaReporte = rangoFechas
  .and(z.object({ sedeId: z.uuid().optional() }))
  .refine((d) => diasEntre(d.desde, d.hasta) <= 366, { message: 'El rango máximo es de un año', path: ['hasta'] });
