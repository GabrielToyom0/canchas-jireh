import { aCentavos, deCentavos } from '../../utils/dinero.js';
import { horaDeMinutos, minutosDeHora, tipoDia } from '../../utils/fechas.js';

/** Lo que el cálculo necesita de una tarifa (ver tarifaJson). */
export interface TarifaRegla {
  tipoDia: string;
  horaInicio: string;
  horaFin: string;
  precioHora: number;
  vigenteDesde: string;
  vigenteHasta: string | null;
}

const finDeFranja = (h: string) => (h === '24:00' ? 24 * 60 : minutosDeHora(h));

/**
 * RN-05: tarifa vigente para una hora concreta, según tipo de día, franja horaria y vigencia.
 * Si dos tarifas aplican, gana la de vigencia más reciente.
 */
export function tarifaPara<T extends TarifaRegla>(tarifas: T[], fecha: string, hora: string): T | undefined {
  const tipo = tipoDia(fecha);
  const minuto = minutosDeHora(hora);
  return tarifas
    .filter(
      (t) =>
        t.tipoDia === tipo &&
        t.vigenteDesde <= fecha &&
        (t.vigenteHasta === null || t.vigenteHasta >= fecha) &&
        minutosDeHora(t.horaInicio) <= minuto &&
        minuto < finDeFranja(t.horaFin),
    )
    .sort((a, b) => b.vigenteDesde.localeCompare(a.vigenteDesde))[0];
}

/**
 * Precio total de `horas` bloques de una hora desde `horaInicio`.
 * Cada hora se cobra con su propia tarifa (una reserva puede cruzar franjas).
 * Devuelve null si alguna hora no tiene tarifa.
 */
export function calcularPrecio(
  tarifas: TarifaRegla[],
  fecha: string,
  horaInicio: string,
  horas: number,
): number | null {
  let centavos = 0;
  for (let i = 0; i < horas; i++) {
    const tarifa = tarifaPara(tarifas, fecha, horaDeMinutos(minutosDeHora(horaInicio) + i * 60));
    if (!tarifa) return null;
    centavos += aCentavos(tarifa.precioHora);
  }
  return deCentavos(centavos);
}
