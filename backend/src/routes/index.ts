import { Router } from 'express';
import { prisma } from '../config/database.js';
import { authRoutes } from './auth.routes.js';
import { bloqueoRoutes } from './bloqueo.routes.js';
import { canchaRoutes } from './cancha.routes.js';
import { disponibilidadRoutes } from './disponibilidad.routes.js';
import { notificacionRoutes } from './notificacion.routes.js';
import { pagoRoutes } from './pago.routes.js';
import { politicaRoutes } from './politica.routes.js';
import { reporteRoutes } from './reporte.routes.js';
import { reservaRoutes } from './reserva.routes.js';
import { sedeRoutes } from './sede.routes.js';
import { tarifaRoutes } from './tarifa.routes.js';
import { usuarioRoutes } from './usuario.routes.js';

/** Todas las rutas de la API; app.ts las monta bajo /api. */
export const rutas = Router();

// Estado del sistema: lo usan Docker (HEALTHCHECK) y el CI.
rutas.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ estado: 'ok', baseDeDatos: 'ok' });
  } catch {
    res.status(503).json({ estado: 'error', baseDeDatos: 'sin conexión' });
  }
});

rutas.use('/auth', authRoutes);
rutas.use('/usuarios', usuarioRoutes);
rutas.use('/sedes', sedeRoutes);
rutas.use('/canchas', canchaRoutes);
rutas.use('/tarifas', tarifaRoutes);
rutas.use('/bloqueos', bloqueoRoutes);
rutas.use('/disponibilidad', disponibilidadRoutes);
rutas.use('/reservas', reservaRoutes);
rutas.use('/politicas', politicaRoutes);
rutas.use('/pagos', pagoRoutes);
rutas.use('/reportes', reporteRoutes);
rutas.use('/notificaciones', notificacionRoutes);
