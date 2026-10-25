import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { UsuarioToken } from '../models/usuario.model.js';
import type { Rol } from '../models/enums.js';
import { noAutenticado } from './errores.js';

const EMISOR = 'canchas-jireh';

/** Access token de vida corta (RNF-01). */
export function firmarAccessToken(usuario: UsuarioToken): string {
  return jwt.sign({ nombre: usuario.nombre, rol: usuario.rol, sedeId: usuario.sedeId }, env.JWT_ACCESS_SECRET, {
    subject: usuario.id,
    issuer: EMISOR,
    algorithm: 'HS256',
    expiresIn: env.JWT_ACCESS_TTL as jwt.SignOptions['expiresIn'],
  });
}

export function verificarAccessToken(token: string): UsuarioToken {
  const datos = jwt.verify(token, env.JWT_ACCESS_SECRET, { issuer: EMISOR, algorithms: ['HS256'] });
  if (typeof datos === 'string' || !datos.sub) throw noAutenticado('Token inválido');
  return {
    id: datos.sub,
    nombre: String(datos.nombre ?? ''),
    rol: datos.rol as Rol,
    sedeId: (datos.sedeId as string | null) ?? null,
  };
}
