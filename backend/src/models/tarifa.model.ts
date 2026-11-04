import type { Tarifa } from '../generated/prisma/client.js';
import { soloFecha } from '../utils/fechas.js';
import type { TipoDia } from './enums.js';

export type { Tarifa };

/** Tarifa en el formato de la API y de las reglas de precio: número y fechas "AAAA-MM-DD". */
interface TarifaJson {
  id: string;
  canchaId: string;
  tipoDia: TipoDia;
  horaInicio: string;
  horaFin: string;
  precioHora: number;
  vigenteDesde: string;
  vigenteHasta: string | null;
  creadoEn: Date;
}

export const tarifaJson = (t: Tarifa): TarifaJson => ({
  ...t,
  tipoDia: t.tipoDia as TipoDia,
  precioHora: Number(t.precioHora),
  vigenteDesde: soloFecha(t.vigenteDesde),
  vigenteHasta: t.vigenteHasta ? soloFecha(t.vigenteHasta) : null,
});
