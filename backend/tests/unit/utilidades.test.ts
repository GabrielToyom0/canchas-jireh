import { describe, expect, it } from 'vitest';
import { aCentavos, porcentajeDe } from '../../src/utils/dinero.js';
import {
  aUtc,
  diasEntre,
  esFecha,
  esHora,
  partesLocales,
  rangoDelDia,
  sumarDias,
  tipoDia,
} from '../../src/utils/fechas.js';
import { compararPassword, hashPassword, hashToken } from '../../src/utils/hash.js';
import { firmarAccessToken, verificarAccessToken } from '../../src/utils/jwt.js';
import { correoPara } from '../../src/utils/plantillasCorreo.js';
import { esquemaPassword } from '../../src/validators/auth.validator.js';

describe('fechas (RNF-06: UTC en BD, America/Guatemala en pantalla)', () => {
  it('convierte hora local de Guatemala a UTC (UTC-6)', () => {
    expect(aUtc('2026-10-24', '18:00').toISOString()).toBe('2026-10-25T00:00:00.000Z');
    expect(aUtc('2026-10-24', '07:00').toISOString()).toBe('2026-10-24T13:00:00.000Z');
  });

  it('obtiene fecha y hora locales desde un instante UTC', () => {
    expect(partesLocales(new Date('2026-10-25T03:30:00Z'))).toEqual({
      fecha: '2026-10-24',
      hora: '21:30',
      diaSemana: 6,
    });
  });

  it('distingue fin de semana para las tarifas (RN-05)', () => {
    expect(tipoDia('2026-10-24')).toBe('FIN_DE_SEMANA');
    expect(tipoDia('2026-10-25')).toBe('FIN_DE_SEMANA');
    expect(tipoDia('2026-10-26')).toBe('ENTRE_SEMANA');
  });

  it('calcula el rango UTC de un día local', () => {
    const { desde, hasta } = rangoDelDia('2026-10-24');
    expect(desde.toISOString()).toBe('2026-10-24T06:00:00.000Z');
    expect(hasta.toISOString()).toBe('2026-10-25T06:00:00.000Z');
  });

  it('suma días y cuenta días cruzando meses', () => {
    expect(sumarDias('2026-10-30', 3)).toBe('2026-11-02');
    expect(diasEntre('2026-10-01', '2026-10-31')).toBe(31);
  });

  it('valida formatos de fecha y hora', () => {
    expect(esFecha('2026-10-24')).toBe(true);
    expect(esFecha('24/10/2026')).toBe(false);
    expect(esHora('07:00')).toBe(true);
    expect(esHora('25:00')).toBe(false);
  });
});

describe('dinero (GTQ en centavos)', () => {
  it('evita errores de punto flotante', () => {
    expect(aCentavos(0.1) + aCentavos(0.2)).toBe(30);
    expect(aCentavos('150.55')).toBe(15055);
  });

  it('calcula porcentajes redondeando al centavo', () => {
    expect(porcentajeDe(440, 50)).toBe(220);
    expect(porcentajeDe(333.33, 50)).toBe(166.67);
  });
});

describe('credenciales y tokens (RNF-01)', () => {
  it('guarda contraseñas con hash bcrypt y nunca en claro', async () => {
    const hash = await hashPassword('Secreta123');
    expect(hash).not.toContain('Secreta123');
    expect(await compararPassword('Secreta123', hash)).toBe(true);
    expect(await compararPassword('otra', hash)).toBe(false);
  });

  it('el refresh token se guarda como SHA-256', () => {
    expect(hashToken('abc')).toHaveLength(64);
  });

  it('exige contraseñas con letras y números', () => {
    expect(esquemaPassword.safeParse('sololetras').success).toBe(false);
    expect(esquemaPassword.safeParse('12345678').success).toBe(false);
    expect(esquemaPassword.safeParse('Valida2026').success).toBe(true);
  });

  it('el access token conserva rol y sede', () => {
    const usuario = {
      id: '00000000-0000-4000-8000-000000000001',
      nombre: 'Ana',
      rol: 'ADMIN_SEDE' as const,
      sedeId: 's1',
    };
    expect(verificarAccessToken(firmarAccessToken(usuario))).toEqual(usuario);
    expect(() => verificarAccessToken('token.falso.x')).toThrow();
  });
});

describe('correos transaccionales (HU-05, RF-15)', () => {
  const datos = {
    nombre: 'Ana',
    canchaNombre: 'Fútbol 5 - A',
    sedeNombre: 'Jireh Zona 10',
    inicio: new Date('2026-10-25T00:00:00.000Z'),
    fin: new Date('2026-10-25T02:00:00.000Z'),
    precioTotal: 440,
  };

  it('confirmación con detalle, total en quetzales y hora de Guatemala', () => {
    const correo = correoPara('RESERVA_CONFIRMADA', datos, 'https://canchas.gt');
    expect(correo.asunto).toBe('Tu reserva está confirmada');
    expect(correo.texto).toContain('Fútbol 5 - A');
    expect(correo.texto).toContain('440.00');
    expect(correo.texto).toMatch(/18:00/); // 00:00 UTC = 18:00 en Guatemala
    expect(correo.html).toContain('https://canchas.gt/mis-reservas');
  });

  it('cancelación informa el porcentaje de reembolso', () => {
    const correo = correoPara('RESERVA_CANCELADA', { ...datos, porcentajeReembolso: 50, motivo: 'Lluvia' }, 'x');
    expect(correo.texto).toContain('50 %');
  });

  it('reembolso indica montos', () => {
    const correo = correoPara('PAGO_REEMBOLSADO', { ...datos, porcentajeReembolso: 50, montoReembolsado: 220 }, 'x');
    expect(correo.asunto).toBe('Reembolso registrado');
    expect(correo.texto).toContain('220.00');
  });

  it('escapa HTML en datos del usuario (evita XSS en el correo)', () => {
    const correo = correoPara('RESERVA_RECORDATORIO', { ...datos, nombre: '<script>alert(1)</script>' }, 'x');
    expect(correo.html).not.toContain('<script>');
    expect(correo.html).toContain('&lt;script&gt;');
  });
});
