import { rateLimit } from 'express-rate-limit';
import { env } from '../config/env.js';

const QUINCE_MIN = 15 * 60 * 1000;

/** Límite general por IP (OWASP: abuso y fuerza bruta). */
export const limiteGeneral = rateLimit({
  windowMs: QUINCE_MIN,
  limit: env.LIMITE_GENERAL,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});

/** Límite estricto para inicio de sesión y registro. */
export const limiteAutenticacion = rateLimit({
  windowMs: QUINCE_MIN,
  limit: env.LIMITE_AUTH,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { codigo: 'DEMASIADOS_INTENTOS', mensaje: 'Demasiados intentos; espere unos minutos' },
});
