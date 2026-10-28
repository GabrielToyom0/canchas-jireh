// RNF-06: las fechas se guardan en UTC y se muestran en America/Guatemala.
// Guatemala no usa horario de verano, así que el desfase es fijo (UTC-6).

import type { TipoDia } from '../models/enums.js';

export const ZONA_HORARIA = 'America/Guatemala';
const DESFASE_MIN = -6 * 60;
const MIN_POR_DIA = 24 * 60;
export const HORA_MS = 3_600_000;

const PATRON_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const PATRON_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

export const esFecha = (texto: string) => PATRON_FECHA.test(texto) && !Number.isNaN(Date.parse(texto));
export const esHora = (texto: string) => PATRON_HORA.test(texto);

/** "07:30" → 450 */
export function minutosDeHora(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

/** 450 → "07:30" */
export function horaDeMinutos(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Fecha y hora locales de Guatemala → instante UTC. */
export function aUtc(fecha: string, hora: string): Date {
  const [a, mes, d] = fecha.split('-').map(Number);
  return new Date(Date.UTC(a, mes - 1, d, 0, minutosDeHora(hora) - DESFASE_MIN));
}

interface PartesLocales {
  fecha: string;
  hora: string;
  /** 0 = domingo … 6 = sábado */
  diaSemana: number;
}

/** Instante UTC → fecha y hora en Guatemala. */
export function partesLocales(instante: Date): PartesLocales {
  const local = new Date(instante.getTime() + DESFASE_MIN * 60_000);
  return {
    fecha: local.toISOString().slice(0, 10),
    hora: local.toISOString().slice(11, 16),
    diaSemana: local.getUTCDay(),
  };
}

export function sumarDias(fecha: string, dias: number): string {
  const base = new Date(`${fecha}T00:00:00Z`);
  base.setUTCDate(base.getUTCDate() + dias);
  return base.toISOString().slice(0, 10);
}

export const hoyLocal = (ahora = new Date()) => partesLocales(ahora).fecha;

export function tipoDia(fecha: string): TipoDia {
  const dia = new Date(`${fecha}T00:00:00Z`).getUTCDay();
  return dia === 0 || dia === 6 ? 'FIN_DE_SEMANA' : 'ENTRE_SEMANA';
}

/** Inicio y fin (UTC) del día local indicado. */
export function rangoDelDia(fecha: string): { desde: Date; hasta: Date } {
  const desde = aUtc(fecha, '00:00');
  return { desde, hasta: new Date(desde.getTime() + MIN_POR_DIA * 60_000) };
}

/** Días locales entre dos fechas, ambas incluidas. */
export function diasEntre(desde: string, hasta: string): number {
  const ms = Date.parse(`${hasta}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`);
  return Math.floor(ms / (MIN_POR_DIA * 60_000)) + 1;
}

/** Columna DATE → "AAAA-MM-DD"; "AAAA-MM-DD" → columna DATE. */
export const soloFecha = (d: Date) => d.toISOString().slice(0, 10);
export const fechaDb = (fecha: string) => new Date(`${fecha}T00:00:00Z`);
