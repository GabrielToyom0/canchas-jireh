/**
 * Datos de demostración: sedes, canchas, tarifas, administradores y un cliente.
 * Uso: npm run db:seed (con la base migrada). Es idempotente: lo que ya existe no se duplica.
 */
import { prisma } from '../src/config/database.js';
import { env } from '../src/config/env.js';
import { authService } from '../src/services/auth.service.js';
import { fechaDb, hoyLocal } from '../src/utils/fechas.js';
import { hashPassword } from '../src/utils/hash.js';

const PASSWORD_DEMO = 'Demo2026!';

const SEDES = [
  {
    nombre: 'Jireh Zona 10',
    direccion: '12 calle 5-40, zona 10',
    zona: 'Zona 10',
    telefono: '2222-1010',
    horaApertura: '07:00',
    horaCierre: '22:00',
    admin: { nombre: 'Ana López', correo: 'admin.zona10@canchasjireh.gt', telefono: '5555-1010' },
    canchas: [
      {
        nombre: 'Fútbol 5 - A',
        deporte: 'FUTBOL',
        superficie: 'Grama sintética',
        capacidad: 10,
        precios: [150, 250, 300],
      },
      { nombre: 'Fútbol 7', deporte: 'FUTBOL', superficie: 'Grama sintética', capacidad: 14, precios: [220, 350, 400] },
      { nombre: 'Básquet 1', deporte: 'BASQUETBOL', superficie: 'Duela', capacidad: 10, precios: [120, 180, 200] },
    ],
  },
  {
    nombre: 'Jireh Mixco',
    direccion: 'Calzada San Juan 20-15, zona 4 de Mixco',
    zona: 'Mixco',
    telefono: '2222-2020',
    horaApertura: '08:00',
    horaCierre: '21:00',
    admin: { nombre: 'Carlos Pérez', correo: 'admin.mixco@canchasjireh.gt', telefono: '5555-2020' },
    canchas: [
      {
        nombre: 'Fútbol 5 - B',
        deporte: 'FUTBOL',
        superficie: 'Grama sintética',
        capacidad: 10,
        precios: [130, 220, 260],
      },
      { nombre: 'Vóley 1', deporte: 'VOLEIBOL', superficie: 'Arena', capacidad: 12, precios: [100, 150, 180] },
    ],
  },
];

async function crearUsuarioSiNoExiste(datos: {
  nombre: string;
  correo: string;
  telefono: string;
  rol: string;
  sedeId?: string;
}) {
  if (await prisma.usuario.findUnique({ where: { correo: datos.correo } })) {
    console.log(`  · ${datos.correo} ya existe`);
    return;
  }
  await prisma.usuario.create({ data: { ...datos, passwordHash: await hashPassword(PASSWORD_DEMO) } });
  console.log(`  ✓ ${datos.correo}`);
}

async function main() {
  await authService.asegurarPropietario();
  const hoy = fechaDb(hoyLocal());

  for (const s of SEDES) {
    const { admin, canchas, ...datosSede } = s;
    let sede = await prisma.sede.findUnique({ where: { nombre: s.nombre } });
    if (sede) {
      console.log(`· ${s.nombre} ya existe`);
    } else {
      sede = await prisma.sede.create({ data: datosSede });
      console.log(`✓ Sede ${sede.nombre}`);
      for (const { precios, ...datosCancha } of canchas) {
        // Entre semana: diurno y nocturno. Fin de semana: tarifa única (RN-05).
        const [diurno, nocturno, finDeSemana] = precios;
        await prisma.cancha.create({
          data: {
            ...datosCancha,
            sedeId: sede.id,
            tarifas: {
              create: [
                {
                  tipoDia: 'ENTRE_SEMANA',
                  horaInicio: s.horaApertura,
                  horaFin: '17:00',
                  precioHora: diurno,
                  vigenteDesde: hoy,
                },
                {
                  tipoDia: 'ENTRE_SEMANA',
                  horaInicio: '17:00',
                  horaFin: s.horaCierre,
                  precioHora: nocturno,
                  vigenteDesde: hoy,
                },
                {
                  tipoDia: 'FIN_DE_SEMANA',
                  horaInicio: s.horaApertura,
                  horaFin: s.horaCierre,
                  precioHora: finDeSemana,
                  vigenteDesde: hoy,
                },
              ],
            },
          },
        });
        console.log(`  ✓ ${datosCancha.nombre} con 3 tarifas`);
      }
    }
    await crearUsuarioSiNoExiste({ ...admin, rol: 'ADMIN_SEDE', sedeId: sede.id });
  }

  await crearUsuarioSiNoExiste({
    nombre: 'Cliente Demo',
    correo: 'cliente@demo.gt',
    telefono: '5555-3030',
    rol: 'CLIENTE',
  });

  console.log(`
Cuentas de demostración
  Propietario     ${env.PROPIETARIO_CORREO ?? '(defina PROPIETARIO_CORREO)'}
  Admin Zona 10   admin.zona10@canchasjireh.gt / ${PASSWORD_DEMO}
  Admin Mixco     admin.mixco@canchasjireh.gt / ${PASSWORD_DEMO}
  Cliente         cliente@demo.gt / ${PASSWORD_DEMO}`);
}

main()
  .catch((err: unknown) => {
    console.error('Error al cargar datos:', (err as Error).message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
