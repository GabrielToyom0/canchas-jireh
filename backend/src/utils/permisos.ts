import type { UsuarioToken } from '../models/usuario.model.js';
import { prohibido } from './errores.js';

/** RN-07: el propietario gestiona todas las sedes; el administrador solo la suya. */
function puedeGestionarSede(usuario: UsuarioToken, sedeId: string): boolean {
  if (usuario.rol === 'PROPIETARIO') return true;
  return usuario.rol === 'ADMIN_SEDE' && usuario.sedeId === sedeId;
}

export function exigirGestionSede(usuario: UsuarioToken, sedeId: string): void {
  if (!puedeGestionarSede(usuario, sedeId)) throw prohibido('Solo puede gestionar recursos de su sede');
}

/**
 * Sede a la que se limita una consulta de gestión: el administrador siempre ve la suya
 * (y no puede pedir otra); el propietario ve la que pida o todas.
 */
export function sedeDeConsulta(usuario: UsuarioToken, sedeId?: string): string | undefined {
  if (usuario.rol !== 'ADMIN_SEDE') return sedeId;
  if (sedeId && sedeId !== usuario.sedeId) throw prohibido();
  return usuario.sedeId ?? undefined;
}
