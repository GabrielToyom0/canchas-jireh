import type { Intervalo } from '../../models/bloqueo.model.js';
import type { HorarioSede } from '../../models/sede.model.js';
import { aUtc, HORA_MS, horaDeMinutos, minutosDeHora } from '../../utils/fechas.js';
import { tarifaPara, type TarifaRegla } from './precio.js';

export type EstadoHorario = 'DISPONIBLE' | 'OCUPADO' | 'BLOQUEADO' | 'PASADO' | 'SIN_TARIFA';

export interface Horario {
  hora: string;
  inicio: string;
  fin: string;
  estado: EstadoHorario;
  precio: number | null;
}

const seTraslapan = (a: Intervalo, b: Intervalo) => a.inicio < b.fin && a.fin > b.inicio;

/** RN-01: dos intervalos chocan si se cruzan; los que solo se tocan no chocan. */
export const hayTraslape = (bloque: Intervalo, otros: Intervalo[]) => otros.some((o) => seTraslapan(bloque, o));

/**
 * RF-07: horarios de una cancha en un día, en bloques de una hora dentro del horario de la sede (RN-02).
 * `ocupados` son las reservas activas (pendientes o confirmadas) de esa cancha.
 */
export function horariosDelDia(
  sede: HorarioSede,
  tarifas: TarifaRegla[],
  bloqueos: Intervalo[],
  ocupados: Intervalo[],
  fecha: string,
  ahora = new Date(),
): Horario[] {
  const horarios: Horario[] = [];
  const cierre = minutosDeHora(sede.horaCierre);

  for (let m = minutosDeHora(sede.horaApertura); m + 60 <= cierre; m += 60) {
    const hora = horaDeMinutos(m);
    const inicio = aUtc(fecha, hora);
    const bloque = { inicio, fin: new Date(inicio.getTime() + HORA_MS) };
    const tarifa = tarifaPara(tarifas, fecha, hora);

    let estado: EstadoHorario = 'DISPONIBLE';
    if (bloque.inicio <= ahora) estado = 'PASADO';
    else if (hayTraslape(bloque, bloqueos)) estado = 'BLOQUEADO';
    else if (hayTraslape(bloque, ocupados)) estado = 'OCUPADO';
    else if (!tarifa) estado = 'SIN_TARIFA';

    horarios.push({
      hora,
      inicio: bloque.inicio.toISOString(),
      fin: bloque.fin.toISOString(),
      estado,
      precio: tarifa?.precioHora ?? null,
    });
  }
  return horarios;
}

/** RN-02: el bloque [inicio, inicio + horas) empieza en hora exacta y cabe en el horario de la sede. */
export function dentroDeHorario(sede: HorarioSede, horaInicio: string, horas: number): boolean {
  const inicio = minutosDeHora(horaInicio);
  return (
    inicio % 60 === 0 &&
    inicio >= minutosDeHora(sede.horaApertura) &&
    inicio + horas * 60 <= minutosDeHora(sede.horaCierre)
  );
}
