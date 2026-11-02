import type { Pago, Reembolso } from '../generated/prisma/client.js';
import type { EstadoPago, MetodoPago } from './enums.js';

export type { Pago, Reembolso };

export interface NuevoPago {
  metodo: MetodoPago;
  estado: Extract<EstadoPago, 'PENDIENTE' | 'CONFIRMADO' | 'RECHAZADO'>;
  comprobanteUrl?: string;
  referenciaBanco?: string;
  ultimos4?: string;
  motivoRechazo?: string;
}

/** Pago en el formato de la API: Decimal → number. */
export const pagoJson = (p: Pago & { reembolsos?: Reembolso[] }) => ({
  ...p,
  monto: Number(p.monto),
  reembolsos: p.reembolsos?.map((r) => ({ ...r, monto: Number(r.monto) })),
});
