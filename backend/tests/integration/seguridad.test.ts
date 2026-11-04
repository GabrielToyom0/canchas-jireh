import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { crearApp } from '../../src/app.js';
import type { Rol } from '../../src/models/enums.js';
import { firmarAccessToken } from '../../src/utils/jwt.js';

// Pruebas de la API sin base de datos: cada caso se resuelve en los middlewares o en la validación,
// antes de llegar a Prisma. Cubren la tabla de control de acceso (RF-02 / RNF-01).
const app = crearApp();
const ID = '00000000-0000-4000-8000-000000000001';
const token = (rol: Rol) =>
  `Bearer ${firmarAccessToken({ id: ID, nombre: 'Prueba', rol, sedeId: rol === 'ADMIN_SEDE' ? ID : null })}`;

describe('cabeceras de seguridad', () => {
  it('aplica helmet y oculta la tecnología del servidor', async () => {
    const r = await request(app).get('/api/no-existe');
    expect(r.status).toBe(404);
    expect(r.headers['x-powered-by']).toBeUndefined();
    expect(r.headers['x-content-type-options']).toBe('nosniff');
    expect(r.headers['content-security-policy']).toBeDefined();
  });

  it('CORS solo permite el origen configurado', async () => {
    const permitido = await request(app).get('/api/no-existe').set('origin', 'http://localhost:5173');
    expect(permitido.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    const ajeno = await request(app).get('/api/no-existe').set('origin', 'https://malicioso.example');
    expect(ajeno.headers['access-control-allow-origin']).toBeUndefined();
  });
});

describe('401: rutas que exigen sesión', () => {
  it.each([
    ['get', '/api/auth/me'],
    ['get', '/api/usuarios'],
    ['post', '/api/sedes'],
    ['post', '/api/canchas'],
    ['patch', `/api/tarifas/${ID}`],
    ['get', '/api/bloqueos'],
    ['get', '/api/reservas/mias'],
    ['put', `/api/politicas/${ID}`],
    ['get', '/api/pagos/mios'],
    ['get', '/api/reportes/ocupacion'],
    ['get', '/api/notificaciones/mias'],
  ] as const)('%s %s', async (metodo, ruta) => {
    expect((await request(app)[metodo](ruta)).status).toBe(401);
  });

  it('rechaza un token inválido', async () => {
    const r = await request(app).get('/api/reservas/mias').set('authorization', 'Bearer x.y.z');
    expect(r.status).toBe(401);
  });

  it('refresh sin cookie responde 401', async () => {
    expect((await request(app).post('/api/auth/refresh')).status).toBe(401);
  });
});

describe('403: control de acceso por rol', () => {
  it.each([
    ['CLIENTE', 'get', '/api/usuarios'],
    ['ADMIN_SEDE', 'get', '/api/usuarios'],
    ['CLIENTE', 'post', '/api/sedes'],
    ['ADMIN_SEDE', 'post', '/api/sedes'],
    ['CLIENTE', 'post', '/api/canchas'],
    ['ADMIN_SEDE', 'post', `/api/canchas/${ID}/tarifas`],
    ['ADMIN_SEDE', 'delete', `/api/tarifas/${ID}`],
    ['CLIENTE', 'get', '/api/bloqueos'],
    ['ADMIN_SEDE', 'post', '/api/reservas'],
    ['CLIENTE', 'get', '/api/reservas/calendario'],
    ['CLIENTE', 'post', `/api/reservas/${ID}/confirmar`],
    ['ADMIN_SEDE', 'put', `/api/politicas/${ID}`],
    ['ADMIN_SEDE', 'post', '/api/pagos/tarjeta'],
    ['CLIENTE', 'get', '/api/pagos/pendientes'],
    ['CLIENTE', 'post', `/api/pagos/${ID}/verificar`],
    ['CLIENTE', 'get', '/api/reportes/ingresos'],
  ] as const)('%s → %s %s', async (rol, metodo, ruta) => {
    expect((await request(app)[metodo](ruta).set('authorization', token(rol))).status).toBe(403);
  });
});

describe('400: validación de entradas', () => {
  it('valida el registro campo por campo (RF-01)', async () => {
    const r = await request(app)
      .post('/api/auth/registro')
      .send({ nombre: 'A', correo: 'x', telefono: '1', password: 'abc' });
    expect(r.status).toBe(400);
    const campos = r.body.detalles.map((d: { campo: string }) => d.campo);
    expect(campos).toEqual(expect.arrayContaining(['nombre', 'correo', 'telefono', 'password']));
  });

  it('rechaza identificadores que no son UUID', async () => {
    const r = await request(app).get('/api/reservas/123').set('authorization', token('CLIENTE'));
    expect(r.status).toBe(400);
  });

  it('valida los datos de la reserva', async () => {
    const r = await request(app)
      .post('/api/reservas')
      .set('authorization', token('CLIENTE'))
      .send({ canchaId: ID, fecha: 'mañana', horaInicio: '7', horas: 20 });
    expect(r.status).toBe(400);
  });

  it('rechaza tarjetas que no pasan Luhn', async () => {
    const r = await request(app)
      .post('/api/pagos/tarjeta')
      .set('authorization', token('CLIENTE'))
      .send({ reservaId: ID, numero: '4242424242424241', titular: 'Ana', expiracion: '12/30', cvv: '123' });
    expect(r.status).toBe(400);
    expect(r.body.detalles[0].campo).toBe('numero');
  });

  it('exige motivo al rechazar un pago', async () => {
    const r = await request(app)
      .post(`/api/pagos/${ID}/verificar`)
      .set('authorization', token('PROPIETARIO'))
      .send({ aprobar: false });
    expect(r.status).toBe(400);
  });

  it('responde 400 ante un JSON mal formado', async () => {
    const r = await request(app).post('/api/auth/login').set('content-type', 'application/json').send('{"correo":');
    expect(r.status).toBe(400);
  });
});
