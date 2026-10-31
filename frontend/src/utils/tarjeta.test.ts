import { describe, expect, it } from 'vitest';
import { agruparNumero, formatoExpiracion } from './tarjeta';

describe('formulario de tarjeta', () => {
  it('agrupa el número de 4 en 4 y descarta lo que no son dígitos', () => {
    expect(agruparNumero('4242424242424242')).toBe('4242 4242 4242 4242');
    expect(agruparNumero('4242-abc-42')).toBe('4242 42');
  });

  it('da formato MM/AA al vencimiento', () => {
    expect(formatoExpiracion('1230')).toBe('12/30');
    expect(formatoExpiracion('1')).toBe('1');
    expect(formatoExpiracion('12/305')).toBe('12/30');
  });
});
