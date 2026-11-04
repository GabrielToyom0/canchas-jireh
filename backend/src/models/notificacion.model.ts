import type { Notificacion, Prisma } from '../generated/prisma/client.js';

export type { Notificacion };

/** Lo que el cliente ve de sus avisos: sin el cuerpo completo del correo. */
export const resumenNotificacion = {
  id: true,
  tipo: true,
  canal: true,
  asunto: true,
  estado: true,
  enviadaEn: true,
  creadoEn: true,
} satisfies Prisma.NotificacionSelect;

/** Máximo de intentos de envío antes de dejar el correo como FALLIDA definitiva. */
export const MAX_INTENTOS_CORREO = 3;
