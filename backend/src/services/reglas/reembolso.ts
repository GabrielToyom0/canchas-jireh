import { HORA_MS } from '../../utils/fechas.js';

export interface ReglaReembolso {
  horasAntes: number;
  porcentajeReembolso: number;
}

/** RN-06: política por defecto (100 % con 24 h o más, 50 % entre 24 y 6 h, 0 % con menos de 6 h). */
export const POLITICA_POR_DEFECTO: ReglaReembolso[] = [
  { horasAntes: 24, porcentajeReembolso: 100 },
  { horasAntes: 6, porcentajeReembolso: 50 },
  { horasAntes: 0, porcentajeReembolso: 0 },
];

/** Porcentaje que corresponde según las horas que faltan para el inicio. */
export function porcentajeReembolso(reglas: ReglaReembolso[], horasAntes: number): number {
  const ordenadas = [...(reglas.length ? reglas : POLITICA_POR_DEFECTO)].sort((a, b) => b.horasAntes - a.horasAntes);
  return ordenadas.find((r) => horasAntes >= r.horasAntes)?.porcentajeReembolso ?? 0;
}

export const horasHasta = (inicio: Date, ahora = new Date()) => (inicio.getTime() - ahora.getTime()) / HORA_MS;
