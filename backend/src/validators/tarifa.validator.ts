import { z } from 'zod';
import { TIPOS_DIA } from '../models/enums.js';
import { minutosDeHora } from '../utils/fechas.js';
import { fecha, horaExacta } from './comun.validator.js';

const camposTarifa = {
  tipoDia: z.enum(TIPOS_DIA),
  horaInicio: horaExacta,
  horaFin: horaExacta.or(z.literal('24:00')),
  precioHora: z.coerce.number().positive('Debe ser mayor a 0').max(10_000),
  vigenteDesde: fecha,
  vigenteHasta: fecha.nullable().optional(),
};

const finDeFranja = (h: string) => (h === '24:00' ? 24 * 60 : minutosDeHora(h));
const tarifaValida = (d: {
  horaInicio?: string;
  horaFin?: string;
  vigenteDesde?: string;
  vigenteHasta?: string | null;
}) =>
  (!d.horaInicio || !d.horaFin || minutosDeHora(d.horaInicio) < finDeFranja(d.horaFin)) &&
  (!d.vigenteDesde || !d.vigenteHasta || d.vigenteDesde <= d.vigenteHasta);

const mensaje = 'La franja o la vigencia no son válidas (inicio debe ser antes del fin)';

// RF-05 / RN-05
export const esquemaTarifa = z.object(camposTarifa).refine(tarifaValida, mensaje);
export const esquemaTarifaParcial = z.object(camposTarifa).partial().refine(tarifaValida, mensaje);
