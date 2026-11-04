// Los montos se calculan en centavos para evitar errores de punto flotante (GTQ).

export const aCentavos = (monto: number | string | { toString(): string }): number =>
  Math.round(Number(monto.toString()) * 100);

export const deCentavos = (centavos: number): number => centavos / 100;

/** Porcentaje entero (0–100) de un monto, redondeado al centavo. */
export const porcentajeDe = (monto: number, porcentaje: number): number =>
  deCentavos(Math.round((aCentavos(monto) * porcentaje) / 100));
