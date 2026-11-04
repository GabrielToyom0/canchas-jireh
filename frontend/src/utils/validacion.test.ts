import { describe, expect, it } from 'vitest';
import { validarRegistro } from './validacion';

describe('validación del registro (HU-01)', () => {
  it('señala cada campo inválido antes de enviar', () => {
    const errores = validarRegistro({
      nombre: 'A',
      correo: 'malo',
      telefono: '12',
      password: 'abcdefgh',
      confirmacion: 'x',
    });
    expect(Object.keys(errores).sort()).toEqual(['confirmacion', 'correo', 'nombre', 'password', 'telefono']);
  });

  it('acepta datos válidos', () => {
    expect(
      validarRegistro({
        nombre: 'Ana López',
        correo: 'ana@x.gt',
        telefono: '5555-1234',
        password: 'Clave2026',
        confirmacion: 'Clave2026',
      }),
    ).toEqual({});
  });
});
