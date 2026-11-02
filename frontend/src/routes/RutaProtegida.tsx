import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { Alerta, Cargando } from '../components/Avisos';
import { useAuth } from '../context/AuthContext';
import type { Rol } from '../types';

/** Exige sesión y, opcionalmente, uno de los roles. El backend vuelve a validar todo. */
export function RutaProtegida({ roles, children }: { roles?: Rol[]; children: ReactNode }) {
  const { usuario, iniciando } = useAuth();
  const ubicacion = useLocation();

  if (iniciando) return <Cargando texto="Verificando sesión…" />;
  if (!usuario) return <Navigate to="/ingresar" replace state={{ volverA: ubicacion.pathname + ubicacion.search }} />;
  if (roles && !roles.includes(usuario.rol)) {
    return <Alerta tipo="error">No tiene permiso para ver esta página.</Alerta>;
  }
  return <>{children}</>;
}
