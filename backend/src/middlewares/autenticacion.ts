import type { Request, RequestHandler } from 'express';
import type { UsuarioToken } from '../models/usuario.model.js';
import { noAutenticado } from '../utils/errores.js';
import { verificarAccessToken } from '../utils/jwt.js';

declare module 'express-serve-static-core' {
  interface Request {
    usuario?: UsuarioToken;
  }
}

/** Lee el token Bearer si existe; si es inválido responde 401. Para rutas públicas que cambian según el rol. */
export const autenticacionOpcional: RequestHandler = (req, _res, next) => {
  const encabezado = req.headers.authorization;
  if (!encabezado) return next();
  const [tipo, token] = encabezado.split(' ');
  if (tipo !== 'Bearer' || !token) return next(noAutenticado('Formato de token inválido'));
  try {
    req.usuario = verificarAccessToken(token);
    next();
  } catch {
    next(noAutenticado('Sesión expirada o token inválido'));
  }
};

/** Exige un access token válido (RNF-01). */
export const autenticar: RequestHandler = (req, res, next) => {
  autenticacionOpcional(req, res, (err?: unknown) => {
    if (err) return next(err);
    if (!req.usuario) return next(noAutenticado());
    next();
  });
};

/** Devuelve el usuario autenticado o lanza 401. */
export function usuarioDe(req: Request): UsuarioToken {
  if (!req.usuario) throw noAutenticado();
  return req.usuario;
}
