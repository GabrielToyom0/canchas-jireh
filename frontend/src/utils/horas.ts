/** "07:00", "22:00" → ["07:00", "08:00", …, "21:00"] (inicio de cada bloque de una hora). */
export function horasDelDia(apertura: string, cierre: string): string[] {
  const inicio = Number(apertura.slice(0, 2));
  const fin = Number(cierre.slice(0, 2));
  return Array.from({ length: Math.max(0, fin - inicio) }, (_, i) => `${String(inicio + i).padStart(2, '0')}:00`);
}

/** Igual que horasDelDia pero incluye la hora de cierre (para elegir el fin de un rango). */
export const horasConCierre = (apertura: string, cierre: string) => [...horasDelDia(apertura, cierre), cierre];
