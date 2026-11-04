import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../../src/config/database.js';
import type { UsuarioToken } from '../../src/models/usuario.model.js';
import { pagoService } from '../../src/services/pago.service.js';
import { reservaService } from '../../src/services/reserva.service.js';
import { fechaDb, hoyLocal, sumarDias } from '../../src/utils/fechas.js';

// Pruebas contra SQL Server real: la garantía contra traslapes (RNF-02) y la atomicidad
// del flujo de pago (pago + confirmación + correo en una sola transacción).
const sufijo = randomUUID().slice(0, 8);
const fecha = sumarDias(hoyLocal(), 30);
let canchaId = '';
let sedeId = '';
const clientes: UsuarioToken[] = [];

const cliente = (n: number) => clientes[n % clientes.length];

beforeAll(async () => {
  const sede = await prisma.sede.create({
    data: {
      nombre: `Sede pruebas ${sufijo}`,
      direccion: 'Dirección de pruebas',
      zona: 'Zona 1',
      telefono: '2222-0000',
      horaApertura: '07:00',
      horaCierre: '22:00',
    },
  });
  sedeId = sede.id;
  const cancha = await prisma.cancha.create({
    data: {
      sedeId,
      nombre: 'Cancha de pruebas',
      deporte: 'FUTBOL',
      superficie: 'Grama',
      capacidad: 10,
      tarifas: {
        create: ['ENTRE_SEMANA', 'FIN_DE_SEMANA'].map((tipoDia) => ({
          tipoDia,
          horaInicio: '07:00',
          horaFin: '22:00',
          precioHora: 100,
          vigenteDesde: fechaDb('2020-01-01'),
        })),
      },
    },
  });
  canchaId = cancha.id;
  for (let i = 0; i < 15; i++) {
    const u = await prisma.usuario.create({
      data: {
        nombre: `Cliente ${i}`,
        correo: `cliente${i}.${sufijo}@pruebas.gt`,
        telefono: '5555-0000',
        passwordHash: 'x',
      },
    });
    clientes.push({ id: u.id, nombre: u.nombre, rol: 'CLIENTE', sedeId: null });
  }
});

afterAll(async () => {
  const usuarioIds = clientes.map((c) => c.id);
  await prisma.notificacion.deleteMany({ where: { usuarioId: { in: usuarioIds } } });
  await prisma.reembolso.deleteMany({ where: { pago: { usuarioId: { in: usuarioIds } } } });
  await prisma.pago.deleteMany({ where: { usuarioId: { in: usuarioIds } } });
  await prisma.reserva.deleteMany({ where: { canchaId } });
  await prisma.cancha.deleteMany({ where: { id: canchaId } });
  await prisma.sede.deleteMany({ where: { id: sedeId } });
  await prisma.usuario.deleteMany({ where: { id: { in: usuarioIds } } });
  await prisma.$disconnect();
});

describe('RN-01 / RNF-02: sin traslapes, aun con solicitudes simultáneas', () => {
  it('de 15 solicitudes simultáneas por el mismo horario solo una se crea', async () => {
    const resultados = await Promise.allSettled(
      clientes.map((c) => reservaService.crear(c, { canchaId, fecha, horaInicio: '18:00', horas: 1 })),
    );
    const rechazadas = resultados.filter((r) => r.status === 'rejected');
    expect(resultados.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(rechazadas).toHaveLength(14);
    for (const r of rechazadas) expect((r as PromiseRejectedResult).reason.status).toBe(409);
  });

  it('rechaza reservas que se traslapan parcialmente', async () => {
    await expect(
      reservaService.crear(cliente(1), { canchaId, fecha, horaInicio: '17:00', horas: 2 }),
    ).rejects.toMatchObject({
      status: 409,
    });
  });

  it('permite reservas contiguas y fija el precio (RN-05)', async () => {
    const r = await reservaService.crear(cliente(2), { canchaId, fecha, horaInicio: '19:00', horas: 1 });
    expect(r.estado).toBe('PENDIENTE');
    expect(Number(r.precioTotal)).toBe(100);
  });

  it('una reserva cancelada libera el horario', async () => {
    const r = await reservaService.crear(cliente(3), { canchaId, fecha, horaInicio: '08:00', horas: 1 });
    await reservaService.cancelar(cliente(3), r, 'Prueba');
    const nueva = await reservaService.crear(cliente(4), { canchaId, fecha, horaInicio: '08:00', horas: 1 });
    expect(nueva.estado).toBe('PENDIENTE');
  });

  it('el trigger de la base rechaza traslapes aunque se inserte sin pasar por la aplicación', async () => {
    const existente = await prisma.reserva.findFirstOrThrow({ where: { canchaId, estado: 'PENDIENTE' } });
    await expect(
      prisma.reserva.create({
        data: {
          usuarioId: existente.usuarioId,
          canchaId,
          sedeId,
          inicio: existente.inicio,
          fin: existente.fin,
          precioTotal: existente.precioTotal,
        },
      }),
    ).rejects.toThrow(/RN-01|51000/);
  });
});

describe('Tabla 8: pago, confirmación y cancelación en una transacción', () => {
  it('pagar con tarjeta confirma la reserva y deja el correo en cola', async () => {
    const r = await reservaService.crear(cliente(5), { canchaId, fecha, horaInicio: '10:00', horas: 2 });
    const pago = await pagoService.pagarConTarjeta(cliente(5), r.id, '4242424242424242');
    expect(pago.estado).toBe('CONFIRMADO');
    expect((await prisma.reserva.findUniqueOrThrow({ where: { id: r.id } })).estado).toBe('CONFIRMADA');
    const avisos = await prisma.notificacion.findMany({ where: { reservaId: r.id } });
    expect(avisos.map((a) => [a.tipo, a.estado])).toEqual([['RESERVA_CONFIRMADA', 'PENDIENTE']]);
  });

  it('una tarjeta rechazada deja el intento registrado y la reserva pendiente', async () => {
    const r = await reservaService.crear(cliente(6), { canchaId, fecha, horaInicio: '12:00', horas: 1 });
    await expect(pagoService.pagarConTarjeta(cliente(6), r.id, '4000000000000002')).rejects.toMatchObject({
      status: 402,
    });
    expect((await prisma.reserva.findUniqueOrThrow({ where: { id: r.id } })).estado).toBe('PENDIENTE');
    expect(await prisma.pago.count({ where: { reservaId: r.id, estado: 'RECHAZADO' } })).toBe(1);
  });

  it('si la reserva expiró no queda ningún pago registrado', async () => {
    const r = await reservaService.crear(cliente(7), { canchaId, fecha, horaInicio: '13:00', horas: 1 });
    await prisma.reserva.update({ where: { id: r.id }, data: { expiraEn: new Date(Date.now() - 60_000) } });
    await expect(pagoService.pagarConTarjeta(cliente(7), r.id, '4242424242424242')).rejects.toMatchObject({
      status: 409,
    });
    expect(await prisma.pago.count({ where: { reservaId: r.id } })).toBe(0);
  });

  it('cancelar una reserva pagada con 30 días de anticipación reembolsa el 100 %', async () => {
    const r = await reservaService.crear(cliente(8), { canchaId, fecha, horaInicio: '15:00', horas: 1 });
    const pago = await pagoService.pagarConTarjeta(cliente(8), r.id, '4242424242424242');
    const confirmada = await reservaService.obtenerConAcceso(cliente(8), r.id);
    const cancelada = await reservaService.cancelar(cliente(8), confirmada, 'Cambio de planes');
    expect(cancelada.estado).toBe('CANCELADA');
    expect((await prisma.pago.findUniqueOrThrow({ where: { id: pago.id } })).estado).toBe('REEMBOLSADO');
    const reembolso = await prisma.reembolso.findUniqueOrThrow({ where: { pagoId: pago.id } });
    expect(Number(reembolso.monto)).toBe(100);
    const tipos = (await prisma.notificacion.findMany({ where: { reservaId: r.id } })).map((n) => n.tipo).sort();
    expect(tipos).toEqual(['PAGO_REEMBOLSADO', 'RESERVA_CANCELADA', 'RESERVA_CONFIRMADA']);
  });
});
