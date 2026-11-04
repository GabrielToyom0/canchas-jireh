import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { alCerrarSesionForzada, fijarToken, renovarSesion, type Sesion } from '../api/cliente';
import { authApi } from '../api/recursos';
import type { Rol, Usuario } from '../types';

interface ValorAuth {
  usuario: Usuario | null;
  /** true mientras se intenta recuperar la sesión al abrir la página */
  iniciando: boolean;
  iniciarSesion: (correo: string, password: string) => Promise<Usuario>;
  registrarse: (datos: { nombre: string; correo: string; telefono: string; password: string }) => Promise<Usuario>;
  cerrarSesion: () => Promise<void>;
  tieneRol: (...roles: Rol[]) => boolean;
}

const ContextoAuth = createContext<ValorAuth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [iniciando, setIniciando] = useState(true);

  const aplicar = useCallback((sesion: Sesion) => {
    fijarToken(sesion.accessToken);
    setUsuario(sesion.usuario);
    return sesion.usuario;
  }, []);

  // Al cargar la página, la cookie httpOnly permite recuperar la sesión sin guardar tokens en el navegador.
  useEffect(() => {
    alCerrarSesionForzada(() => {
      fijarToken(null);
      setUsuario(null);
    });
    renovarSesion()
      .then((sesion) => sesion && aplicar(sesion))
      .finally(() => setIniciando(false));
  }, [aplicar]);

  const valor = useMemo<ValorAuth>(
    () => ({
      usuario,
      iniciando,
      iniciarSesion: async (correo, password) => aplicar(await authApi.login(correo, password)),
      registrarse: async (datos) => aplicar(await authApi.registro(datos)),
      cerrarSesion: async () => {
        await authApi.logout().catch(() => undefined);
        fijarToken(null);
        setUsuario(null);
      },
      tieneRol: (...roles) => !!usuario && roles.includes(usuario.rol),
    }),
    [usuario, iniciando, aplicar],
  );

  return <ContextoAuth.Provider value={valor}>{children}</ContextoAuth.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): ValorAuth {
  const valor = useContext(ContextoAuth);
  if (!valor) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return valor;
}
