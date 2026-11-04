import { z } from 'zod';
import { pasaLuhn, vigente } from '../services/reglas/tarjetaSimulada.js';

export const esquemaReservaPago = z.object({ reservaId: z.uuid('Reserva inválida') });

// RF-14 / RN-08: datos de la tarjeta simulada. Nunca se guarda el número completo ni el CVV.
export const esquemaTarjeta = esquemaReservaPago.extend({
  numero: z
    .string()
    .transform((n) => n.replace(/[\s-]/g, ''))
    .refine((n) => /^\d{13,19}$/.test(n), 'Número de tarjeta inválido')
    .refine(pasaLuhn, 'Número de tarjeta inválido'),
  titular: z.string().trim().min(3, 'Ingrese el nombre del titular').max(100),
  expiracion: z
    .string()
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Use el formato MM/AA')
    .refine((e) => vigente(e), 'La tarjeta está vencida'),
  cvv: z.string().regex(/^\d{3,4}$/, 'CVV inválido'),
});

export const esquemaTransferencia = esquemaReservaPago.extend({
  referenciaBanco: z.string().trim().min(3, 'Ingrese el número de referencia').max(50),
});

export const esquemaFiltroPendientes = z.object({ sedeId: z.uuid().optional() });

// HU-10
export const esquemaVerificacion = z
  .object({ aprobar: z.boolean(), motivo: z.string().trim().min(3).max(200).optional() })
  .refine((d) => d.aprobar || d.motivo, { message: 'Indique el motivo del rechazo', path: ['motivo'] });
