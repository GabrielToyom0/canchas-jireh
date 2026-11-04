import type { Rol } from '../types';

/** Página de inicio para cada rol después de iniciar sesión. */
export const INICIO_POR_ROL: Record<Rol, string> = {
  CLIENTE: '/',
  ADMIN_SEDE: '/panel/calendario',
  PROPIETARIO: '/panel/reportes',
};
