import { describe, expect, it } from 'vitest';
import { formatoMoneda, hoyGuatemala, partesDia, sumarDias } from './formato';
import { horasConCierre, horasDelDia } from './horas';

describe('formato (RNF-06)', () => {
  it('muestra precios en quetzales', () => {
    expect(formatoMoneda(1500)).toMatch(/^Q\s?1,500\.00$/);
  });

  it('calcula la fecha de hoy en Guatemala aunque en UTC ya sea mañana', () => {
    expect(hoyGuatemala(new Date('2026-10-25T03:00:00Z'))).toBe('2026-10-24');
    expect(sumarDias('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('separa una fecha en día de la semana, número y mes para la tira de días', () => {
    expect(partesDia('2026-10-24')).toEqual({ semana: 'sáb', dia: '24', mes: 'octubre' });
    expect(partesDia('2026-11-02').dia).toBe('2');
  });

  it('genera las horas de un horario de atención', () => {
    expect(horasDelDia('07:00', '10:00')).toEqual(['07:00', '08:00', '09:00']);
    expect(horasConCierre('07:00', '09:00')).toEqual(['07:00', '08:00', '09:00']);
  });
});
