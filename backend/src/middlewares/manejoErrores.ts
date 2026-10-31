import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { ErrorApp } from '../utils/errores.js';
import { logger } from '../utils/logger.js';

export const rutaNoEncontrada: RequestHandler = (req, _res, next) => {
  next(new ErrorApp(404, 'RUTA_NO_ENCONTRADA', `No existe ${req.method} ${req.path}`));
};

/** Manejador final: nunca expone trazas ni mensajes internos al cliente. */
export const manejadorErrores: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      codigo: 'VALIDACION',
      mensaje: 'Datos inválidos',
      detalles: err.issues.map((i) => ({ campo: i.path.join('.'), mensaje: i.message })),
    });
    return;
  }
  if (err instanceof ErrorApp) {
    res.status(err.status).json({ codigo: err.codigo, mensaje: err.message, detalles: err.detalles });
    return;
  }
  // P2028: no hubo conexión libre para abrir la transacción (mucha carga). Se puede reintentar.
  if ((err as { code?: string }).code === 'P2028') {
    res.status(503).json({ codigo: 'SISTEMA_OCUPADO', mensaje: 'El sistema está ocupado; intente de nuevo' });
    return;
  }
  // Errores de express.json() (cuerpo mal formado o muy grande).
  const status = (err as { status?: number }).status;
  if (status === 400 || status === 413) {
    res.status(status).json({ codigo: 'CUERPO_INVALIDO', mensaje: 'Cuerpo de la solicitud inválido' });
    return;
  }
  logger.error({ err, metodo: req.method, ruta: req.originalUrl }, 'Error no controlado');
  res.status(500).json({ codigo: 'ERROR_INTERNO', mensaje: 'Ocurrió un error inesperado' });
};
