import { describe, expect, it } from 'vitest';
import type { Horario } from '../types';
import { describirPolitica, horariosContiguos, totalEstimado } from './calculos';

const h = (hora: string, estado: Horario['estado'] = 'DISPONIBLE', precio = 150): Horario => ({
  hora,
  inicio: '',
  fin: '',
  estado,
  precio,
});

describe('cálculo de la reserva', () => {
  const horarios = [h('16:00'), h('17:00', 'DISPONIBLE', 250), h('18:00'), h('19:00', 'OCUPADO'), h('20:00')];

  it('cuenta solo las horas libres seguidas desde la elegida', () => {
    expect(horariosContiguos(horarios, '16:00').map((x) => x.hora)).toEqual(['16:00', '17:00', '18:00']);
    expect(horariosContiguos(horarios, '20:00')).toHaveLength(1);
    expect(horariosContiguos(horarios, '19:00')).toHaveLength(0);
  });

  it('suma el precio de cada hora sin errores de redondeo', () => {
    expect(totalEstimado(horarios, 2)).toBe(400);
    expect(totalEstimado([h('1', 'DISPONIBLE', 0.1), h('2', 'DISPONIBLE', 0.2)], 2)).toBe(0.3);
  });

  it('describe la política de cancelación en lenguaje claro (RN-06)', () => {
    expect(
      describirPolitica([
        { horasAntes: 0, porcentajeReembolso: 0 },
        { horasAntes: 24, porcentajeReembolso: 100 },
        { horasAntes: 6, porcentajeReembolso: 50 },
      ]),
    ).toEqual([
      'Con 24 horas o más de anticipación: 100 % de reembolso',
      'Entre 24 y 6 horas: 50 % de reembolso',
      'Con menos de 6 horas: 0 % de reembolso',
    ]);
  });
});
