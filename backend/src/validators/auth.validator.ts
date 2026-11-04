import { z } from 'zod';
import { telefono } from './comun.validator.js';

export const esquemaPassword = z
  .string()
  .min(8, 'Mínimo 8 caracteres')
  .max(72, 'Máximo 72 caracteres')
  .regex(/[A-Za-z]/, 'Debe incluir al menos una letra')
  .regex(/\d/, 'Debe incluir al menos un número');

export const esquemaCorreo = z
  .email('Correo inválido')
  .max(150)
  .transform((c) => c.toLowerCase());

export const esquemaNombre = z.string().trim().min(2, 'Nombre muy corto').max(100);

// HU-01 / RF-01
export const esquemaRegistro = z.object({
  nombre: esquemaNombre,
  correo: esquemaCorreo,
  telefono,
  password: esquemaPassword,
});

export const esquemaLogin = z.object({
  correo: esquemaCorreo,
  password: z.string().min(1, 'Ingrese su contraseña').max(72),
});
