import { z } from 'zod';
import { minutosDeHora } from '../utils/fechas.js';
import { horaExacta, telefono } from './comun.validator.js';

const camposSede = {
  nombre: z.string().trim().min(2).max(100),
  direccion: z.string().trim().min(5).max(200),
  zona: z.string().trim().min(1).max(50),
  telefono,
  horaApertura: horaExacta,
  horaCierre: horaExacta,
};

const horarioValido = (d: { horaApertura?: string; horaCierre?: string }) =>
  !d.horaApertura || !d.horaCierre || minutosDeHora(d.horaApertura) < minutosDeHora(d.horaCierre);

const errorHorario = { message: 'La apertura debe ser antes del cierre', path: ['horaCierre'] };

// RF-03
export const esquemaSede = z.object(camposSede).refine(horarioValido, errorHorario);

export const esquemaSedeParcial = z
  .object({ ...camposSede, activa: z.boolean() })
  .partial()
  .refine(horarioValido, errorHorario);

export const esquemaFiltroSedes = z.object({ incluirInactivas: z.stringbool().default(false) });
