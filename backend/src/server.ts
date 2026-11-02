import { crearApp } from './app.js';
import { prisma } from './config/database.js';
import { env } from './config/env.js';
import { iniciarProgramador } from './jobs/programador.js';
import { authService } from './services/auth.service.js';
import { logger } from './utils/logger.js';

await authService.asegurarPropietario();
const detenerProgramador = iniciarProgramador();
const servidor = crearApp().listen(env.PORT, () => logger.info(`Canchas Jireh escuchando en el puerto ${env.PORT}`));

/** Cierre ordenado con SIGTERM/SIGINT (Docker): deja de aceptar solicitudes y libera la base de datos. */
function cerrar(senal: string) {
  logger.info(`${senal} recibido, cerrando`);
  detenerProgramador();
  servidor.close(() => {
    prisma
      .$disconnect()
      .catch((err: unknown) => logger.error({ err }, 'Error al cerrar'))
      .finally(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => cerrar('SIGTERM'));
process.on('SIGINT', () => cerrar('SIGINT'));
