import type { ReactNode } from 'react';
import type { Rol } from '../types';

/** Una página del sitio (ver rutas.tsx). */
export interface RutaApp {
  path?: string;
  index?: boolean;
  element: ReactNode;
  /** Si se indica, exige sesión con uno de estos roles. */
  roles?: Rol[];
}

export const GESTORES: Rol[] = ['ADMIN_SEDE', 'PROPIETARIO'];
