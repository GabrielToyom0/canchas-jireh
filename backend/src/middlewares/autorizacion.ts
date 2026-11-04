import type { RequestHandler } from 'express';
import type { Rol } from '../models/enums.js';
import { noAutenticado, prohibido } from '../utils/errores.js';

/**
 * RF-02: restringe la ruta a ciertos roles. Va después de `autenticar`.
 * La regla por sede (RN-07) se valida en los servicios con `exigirGestionSede`,
 * porque depende del recurso concreto y no solo de la URL.
 */
function requerirRol(...roles: Rol[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.usuario) return next(noAutenticado());
    if (!roles.includes(req.usuario.rol)) return next(prohibido());
    next();
  };
}

export const soloCliente = requerirRol('CLIENTE');
export const soloPropietario = requerirRol('PROPIETARIO');
export const gestores = requerirRol('ADMIN_SEDE', 'PROPIETARIO');
