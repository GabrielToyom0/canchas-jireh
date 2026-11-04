import type { Usuario } from '../generated/prisma/client.js';
import type { Rol } from './enums.js';

export type { Usuario };

/** Datos del usuario que viajan dentro del access token (RNF-01). */
export interface UsuarioToken {
  id: string;
  nombre: string;
  rol: Rol;
  /** Solo para ADMIN_SEDE (RN-07). */
  sedeId: string | null;
}

/** Usuario sin el hash de la contraseña: lo único que sale por la API. */
export type UsuarioPublico = Omit<Usuario, 'passwordHash'>;

export function usuarioPublico(u: Usuario): UsuarioPublico {
  const { passwordHash: _omitido, ...publico } = u;
  return publico;
}

export const usuarioToken = (u: Usuario): UsuarioToken => ({
  id: u.id,
  nombre: u.nombre,
  rol: u.rol as Rol,
  sedeId: u.sedeId,
});
