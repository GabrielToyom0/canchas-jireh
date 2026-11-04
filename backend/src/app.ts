import { existsSync } from 'node:fs';
import path from 'node:path';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { limiteGeneral } from './middlewares/limiteSolicitudes.js';
import { manejadorErrores, rutaNoEncontrada } from './middlewares/manejoErrores.js';
import { rutas } from './routes/index.js';
import { logger } from './utils/logger.js';

/** Registra cada solicitud de la API con su estado y duración. */
const registrarSolicitudes: express.RequestHandler = (req, res, next) => {
  const inicio = performance.now();
  res.on('finish', () => {
    if (req.path === '/api/health') return;
    logger.info(
      { metodo: req.method, ruta: req.originalUrl, status: res.statusCode, ms: Math.round(performance.now() - inicio) },
      'solicitud',
    );
  });
  next();
};

/** En producción el mismo proceso sirve el frontend compilado (React) y la API. */
function servirFrontend(app: Express) {
  const carpeta = env.FRONTEND_DIST ? path.resolve(env.FRONTEND_DIST) : undefined;
  if (!carpeta || !existsSync(path.join(carpeta, 'index.html'))) return;
  // Los archivos de assets/ llevan un hash en el nombre: se pueden guardar en caché por un año.
  app.use('/assets', express.static(path.join(carpeta, 'assets'), { maxAge: '1y', immutable: true }));
  app.use(express.static(carpeta, { index: false, maxAge: '1h' }));
  // Cualquier otra ruta GET que no sea de la API la resuelve el enrutador de React.
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(carpeta, 'index.html'));
  });
}

export function crearApp(): Express {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  // Seguridad (RNF-01 / OWASP): cabeceras, CORS restringido y límite de peticiones.
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: { 'img-src': ["'self'", 'data:', 'blob:'], 'frame-src': ["'self'", 'blob:'] },
      },
    }),
  );
  app.use('/api', cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use('/api', limiteGeneral);
  app.use(express.json({ limit: '100kb' }));
  app.use(registrarSolicitudes);

  app.use('/api', rutas);
  servirFrontend(app);

  app.use(rutaNoEncontrada);
  app.use(manejadorErrores);
  return app;
}
