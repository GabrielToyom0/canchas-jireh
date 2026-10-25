// RN-08: pasarela de tarjeta SIMULADA (no hay pasarela real en el alcance del MVP).
// Tarjetas de prueba:
//   4242 4242 4242 4242 → aprobada
//   4000 0000 0000 0002 → rechazada por el banco
//   4000 0000 0000 9995 → fondos insuficientes

/** Algoritmo de Luhn: valida el dígito verificador de un número de tarjeta. */
export function pasaLuhn(numero: string): boolean {
  let suma = 0;
  let doble = false;
  for (let i = numero.length - 1; i >= 0; i--) {
    let d = Number(numero[i]);
    if (doble) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    suma += d;
    doble = !doble;
  }
  return suma % 10 === 0;
}

/** "MM/AA" vigente a la fecha indicada. */
export function vigente(expiracion: string, ahora = new Date()): boolean {
  const [mes, anio] = expiracion.split('/').map(Number);
  return new Date(Date.UTC(2000 + anio, mes, 1)) > ahora;
}

type ResultadoCobro = { aprobado: true } | { aprobado: false; motivo: string };

export function simularCobro(numero: string): ResultadoCobro {
  if (numero.endsWith('0002')) return { aprobado: false, motivo: 'Tarjeta rechazada por el banco emisor' };
  if (numero.endsWith('9995')) return { aprobado: false, motivo: 'Fondos insuficientes' };
  return { aprobado: true };
}
