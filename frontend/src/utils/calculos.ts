import type { Horario, ReglaReembolso } from '../types';

/** Horarios disponibles seguidos a partir de `hora` (máximo `limite`). */
export function horariosContiguos(horarios: Horario[], hora: string, limite = 8): Horario[] {
  const inicio = horarios.findIndex((h) => h.hora === hora);
  if (inicio < 0) return [];
  const resultado: Horario[] = [];
  for (let i = inicio; i < horarios.length && resultado.length < limite; i++) {
    if (horarios[i].estado !== 'DISPONIBLE') break;
    resultado.push(horarios[i]);
  }
  return resultado;
}

/** Suma de los precios de las primeras `horas` (cada hora con su tarifa). */
export function totalEstimado(horarios: Horario[], horas: number): number {
  const centavos = horarios.slice(0, horas).reduce((t, h) => t + Math.round((h.precio ?? 0) * 100), 0);
  return centavos / 100;
}

/** Texto legible de la política de cancelación (RN-06). */
export function describirPolitica(reglas: ReglaReembolso[]): string[] {
  const orden = [...reglas].sort((a, b) => b.horasAntes - a.horasAntes);
  return orden.map((r, i) => {
    const anterior = orden[i - 1];
    if (i === 0) return `Con ${r.horasAntes} horas o más de anticipación: ${r.porcentajeReembolso} % de reembolso`;
    if (r.horasAntes === 0) return `Con menos de ${anterior.horasAntes} horas: ${r.porcentajeReembolso} % de reembolso`;
    return `Entre ${anterior.horasAntes} y ${r.horasAntes} horas: ${r.porcentajeReembolso} % de reembolso`;
  });
}
