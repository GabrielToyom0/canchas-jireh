import { z } from 'zod';
import { esFecha, esHora } from '../utils/fechas.js';

export const esquemaId = z.object({ id: z.uuid('Identificador inválido') });

export const fecha = z.string().refine(esFecha, 'Fecha inválida (AAAA-MM-DD)');
export const hora = z.string().refine(esHora, 'Hora inválida (HH:mm)');

// RN-02: las reservas son por bloques de una hora, así que horarios y franjas van en horas exactas.
export const horaExacta = hora.refine((h) => h.endsWith(':00'), 'Debe ser una hora exacta (ej. 07:00)');

export const telefono = z
  .string()
  .trim()
  .regex(/^\+?[\d\s-]{8,20}$/, 'Teléfono inválido');

export const rangoFechas = z
  .object({ desde: fecha, hasta: fecha })
  .refine((d) => d.desde <= d.hasta, { message: 'El rango de fechas no es válido', path: ['hasta'] });
