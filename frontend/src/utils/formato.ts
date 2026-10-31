import type { Deporte, EstadoPago, EstadoReserva, MetodoPago, Rol, TipoDia } from '../types';

// RNF-06: precios en quetzales y fechas mostradas en la zona de Guatemala.
const ZONA = 'America/Guatemala';

const moneda = new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' });
export const formatoMoneda = (monto: number) => moneda.format(monto);

const fecha = new Intl.DateTimeFormat('es-GT', {
  timeZone: ZONA,
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});
const fechaLarga = new Intl.DateTimeFormat('es-GT', { timeZone: ZONA, weekday: 'long', day: 'numeric', month: 'long' });
const hora = new Intl.DateTimeFormat('es-GT', { timeZone: ZONA, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const fechaHora = new Intl.DateTimeFormat('es-GT', {
  timeZone: ZONA,
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const formatoFecha = (iso: string) => fecha.format(new Date(iso));
export const formatoHora = (iso: string) => hora.format(new Date(iso));
export const formatoFechaHora = (iso: string) => fechaHora.format(new Date(iso));
export const formatoRango = (inicio: string, fin: string) =>
  `${formatoFecha(inicio)}, ${formatoHora(inicio)} – ${formatoHora(fin)}`;

/** "2026-10-24" → "sábado, 24 de octubre" */
export const formatoFechaLocal = (fechaLocal: string) => fechaLarga.format(new Date(`${fechaLocal}T12:00:00-06:00`));

const diaSemana = new Intl.DateTimeFormat('es-GT', { timeZone: ZONA, weekday: 'short' });
const nombreMes = new Intl.DateTimeFormat('es-GT', { timeZone: ZONA, month: 'long' });

/** "2026-10-24" → { semana: 'sáb', dia: '24', mes: 'octubre' }, para la tira de días de la búsqueda. */
export function partesDia(fechaLocal: string) {
  const d = new Date(`${fechaLocal}T12:00:00-06:00`);
  return {
    semana: diaSemana.format(d).replace('.', ''),
    dia: String(Number(fechaLocal.slice(8, 10))),
    mes: nombreMes.format(d),
  };
}

/** Fecha de hoy en Guatemala, formato AAAA-MM-DD. */
export function hoyGuatemala(ahora = new Date()): string {
  return new Date(ahora.getTime() - 6 * 3_600_000).toISOString().slice(0, 10);
}

export function sumarDias(fechaLocal: string, dias: number): string {
  const d = new Date(`${fechaLocal}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

export const DEPORTES: Record<Deporte, string> = {
  FUTBOL: 'Fútbol',
  BASQUETBOL: 'Básquetbol',
  VOLEIBOL: 'Voleibol',
};

export const TIPOS_DIA: Record<TipoDia, string> = {
  ENTRE_SEMANA: 'Entre semana',
  FIN_DE_SEMANA: 'Fin de semana',
};

export const ROLES: Record<Rol, string> = {
  CLIENTE: 'Cliente',
  ADMIN_SEDE: 'Administrador de sede',
  PROPIETARIO: 'Propietario',
};

export const METODOS_PAGO: Record<MetodoPago, string> = {
  TARJETA_SIMULADA: 'Tarjeta',
  TRANSFERENCIA: 'Transferencia',
  EFECTIVO: 'Efectivo',
};

type Tono = 'verde' | 'ambar' | 'rojo' | 'azul' | 'gris';

export const ESTADOS_RESERVA: Record<EstadoReserva, { texto: string; tono: Tono }> = {
  PENDIENTE: { texto: 'Pendiente de pago', tono: 'ambar' },
  CONFIRMADA: { texto: 'Confirmada', tono: 'verde' },
  COMPLETADA: { texto: 'Completada', tono: 'azul' },
  CANCELADA: { texto: 'Cancelada', tono: 'rojo' },
  EXPIRADA: { texto: 'Expirada', tono: 'gris' },
  NO_SE_PRESENTO: { texto: 'No se presentó', tono: 'gris' },
};

export const ESTADOS_PAGO: Record<EstadoPago, { texto: string; tono: Tono }> = {
  PENDIENTE: { texto: 'En verificación', tono: 'ambar' },
  CONFIRMADO: { texto: 'Confirmado', tono: 'verde' },
  RECHAZADO: { texto: 'Rechazado', tono: 'rojo' },
  REEMBOLSADO: { texto: 'Reembolsado', tono: 'azul' },
};
