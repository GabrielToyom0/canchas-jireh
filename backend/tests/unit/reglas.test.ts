import { describe, expect, it } from 'vitest';
import { dentroDeHorario, hayTraslape, horariosDelDia } from '../../src/services/reglas/horario.js';
import { calcularPrecio, tarifaPara, type TarifaRegla } from '../../src/services/reglas/precio.js';
import { POLITICA_POR_DEFECTO, porcentajeReembolso } from '../../src/services/reglas/reembolso.js';
import { pasaLuhn, simularCobro, vigente } from '../../src/services/reglas/tarjetaSimulada.js';

const tarifa = (t: Partial<TarifaRegla>): TarifaRegla => ({
  tipoDia: 'ENTRE_SEMANA',
  horaInicio: '07:00',
  horaFin: '17:00',
  precioHora: 150,
  vigenteDesde: '2026-01-01',
  vigenteHasta: null,
  ...t,
});

const TARIFAS = [
  tarifa({}),
  tarifa({ horaInicio: '17:00', horaFin: '22:00', precioHora: 250 }),
  tarifa({ tipoDia: 'FIN_DE_SEMANA', horaFin: '22:00', precioHora: 300 }),
];

const LUNES = '2026-10-26';
const SABADO = '2026-10-24';

describe('RN-05: precio según tarifa vigente', () => {
  it('elige la franja y el tipo de día correctos', () => {
    expect(tarifaPara(TARIFAS, LUNES, '10:00')?.precioHora).toBe(150);
    expect(tarifaPara(TARIFAS, LUNES, '18:00')?.precioHora).toBe(250);
    expect(tarifaPara(TARIFAS, SABADO, '10:00')?.precioHora).toBe(300);
  });

  it('la hora de fin de la franja es exclusiva', () => {
    expect(tarifaPara(TARIFAS, LUNES, '17:00')?.precioHora).toBe(250);
  });

  it('respeta la vigencia y prefiere la tarifa más reciente', () => {
    const conAumento = [...TARIFAS, tarifa({ precioHora: 175, vigenteDesde: '2026-10-01' })];
    expect(tarifaPara(conAumento, LUNES, '10:00')?.precioHora).toBe(175);
    expect(tarifaPara([tarifa({ vigenteHasta: '2026-09-30' })], LUNES, '10:00')).toBeUndefined();
  });

  it('acepta franjas que terminan a medianoche (24:00)', () => {
    expect(tarifaPara([tarifa({ horaInicio: '20:00', horaFin: '24:00' })], LUNES, '23:00')).toBeDefined();
  });

  it('suma cada hora con su propia tarifa cuando la reserva cruza franjas', () => {
    expect(calcularPrecio(TARIFAS, LUNES, '16:00', 2)).toBe(400);
    expect(calcularPrecio(TARIFAS, SABADO, '16:00', 2)).toBe(600);
  });

  it('devuelve null si alguna hora no tiene tarifa', () => {
    expect(calcularPrecio(TARIFAS, LUNES, '21:00', 2)).toBeNull();
  });
});

describe('RN-06: política de cancelación', () => {
  it('aplica la política por defecto (100 / 50 / 0 %)', () => {
    expect(porcentajeReembolso(POLITICA_POR_DEFECTO, 30)).toBe(100);
    expect(porcentajeReembolso(POLITICA_POR_DEFECTO, 24)).toBe(100);
    expect(porcentajeReembolso(POLITICA_POR_DEFECTO, 23.9)).toBe(50);
    expect(porcentajeReembolso(POLITICA_POR_DEFECTO, 6)).toBe(50);
    expect(porcentajeReembolso(POLITICA_POR_DEFECTO, 5)).toBe(0);
  });

  it('usa la política configurada por la sede', () => {
    const reglas = [
      { horasAntes: 48, porcentajeReembolso: 90 },
      { horasAntes: 0, porcentajeReembolso: 10 },
    ];
    expect(porcentajeReembolso(reglas, 50)).toBe(90);
    expect(porcentajeReembolso(reglas, 47)).toBe(10);
  });

  it('sin reglas configuradas usa la política por defecto', () => {
    expect(porcentajeReembolso([], 10)).toBe(50);
  });
});

describe('RN-02 / RF-07: disponibilidad por bloques de una hora', () => {
  const sede = { horaApertura: '07:00', horaCierre: '10:00' };
  const bloqueos = [{ inicio: new Date('2026-10-26T15:00:00Z'), fin: new Date('2026-10-26T16:00:00Z') }];
  const antes = new Date('2026-10-20T00:00:00Z');

  it('genera un horario por hora dentro del horario de la sede', () => {
    const horarios = horariosDelDia(sede, TARIFAS, bloqueos, [], LUNES, antes);
    expect(horarios.map((h) => h.hora)).toEqual(['07:00', '08:00', '09:00']);
  });

  it('marca ocupados, bloqueados y pasados', () => {
    const ocupados = [{ inicio: new Date('2026-10-26T13:00:00Z'), fin: new Date('2026-10-26T14:00:00Z') }];
    const estados = horariosDelDia(sede, TARIFAS, bloqueos, ocupados, LUNES, antes).map((h) => h.estado);
    expect(estados).toEqual(['OCUPADO', 'DISPONIBLE', 'BLOQUEADO']);

    const durante = new Date('2026-10-26T14:30:00Z');
    expect(horariosDelDia(sede, TARIFAS, [], [], LUNES, durante)[0].estado).toBe('PASADO');
  });

  it('incluye el precio de cada horario', () => {
    expect(horariosDelDia(sede, TARIFAS, [], [], LUNES, antes)[0].precio).toBe(150);
  });

  it('valida que la reserva quede dentro del horario de la sede', () => {
    expect(dentroDeHorario(sede, '07:00', 3)).toBe(true);
    expect(dentroDeHorario(sede, '08:00', 3)).toBe(false);
    expect(dentroDeHorario(sede, '06:00', 1)).toBe(false);
    expect(dentroDeHorario(sede, '07:30', 1)).toBe(false);
  });

  it('detecta traslapes (RN-01) sin contar bloques que solo se tocan', () => {
    const r = { inicio: new Date('2026-10-26T13:00:00Z'), fin: new Date('2026-10-26T15:00:00Z') };
    const cruza = { inicio: new Date('2026-10-26T14:00:00Z'), fin: new Date('2026-10-26T16:00:00Z') };
    const contiguo = { inicio: new Date('2026-10-26T15:00:00Z'), fin: new Date('2026-10-26T16:00:00Z') };
    expect(hayTraslape(cruza, [r])).toBe(true);
    expect(hayTraslape(contiguo, [r])).toBe(false);
  });
});

describe('RN-08: tarjeta simulada', () => {
  it('valida el dígito verificador (Luhn)', () => {
    expect(pasaLuhn('4242424242424242')).toBe(true);
    expect(pasaLuhn('4242424242424241')).toBe(false);
  });

  it('valida la fecha de vencimiento', () => {
    const ahora = new Date('2026-10-22T00:00:00Z');
    expect(vigente('10/26', ahora)).toBe(true);
    expect(vigente('09/26', ahora)).toBe(false);
  });

  it('simula aprobaciones y rechazos con las tarjetas de prueba', () => {
    expect(simularCobro('4242424242424242')).toEqual({ aprobado: true });
    expect(simularCobro('4000000000000002').aprobado).toBe(false);
    expect(simularCobro('4000000000009995').aprobado).toBe(false);
  });
});
