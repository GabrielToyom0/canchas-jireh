import { Suspense, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import type { Rol } from '../types';
import { ROLES } from '../utils/formato';
import { Cargando } from './Avisos';

interface Enlace {
  a: string;
  texto: string;
  roles?: Rol[] | 'invitado';
}

const ENLACES: Enlace[] = [
  { a: '/', texto: 'Buscar canchas' },
  { a: '/mis-reservas', texto: 'Mis reservas', roles: ['CLIENTE'] },
  { a: '/mis-pagos', texto: 'Mis pagos', roles: ['CLIENTE'] },
  { a: '/panel/calendario', texto: 'Calendario', roles: ['ADMIN_SEDE', 'PROPIETARIO'] },
  { a: '/panel/pagos', texto: 'Verificar pagos', roles: ['ADMIN_SEDE', 'PROPIETARIO'] },
  { a: '/panel/canchas', texto: 'Canchas', roles: ['ADMIN_SEDE', 'PROPIETARIO'] },
  { a: '/panel/bloqueos', texto: 'Bloqueos', roles: ['ADMIN_SEDE', 'PROPIETARIO'] },
  { a: '/panel/sedes', texto: 'Sedes', roles: ['PROPIETARIO'] },
  { a: '/panel/administradores', texto: 'Administradores', roles: ['PROPIETARIO'] },
  { a: '/panel/politicas', texto: 'Políticas', roles: ['PROPIETARIO'] },
  { a: '/panel/reportes', texto: 'Reportes', roles: ['ADMIN_SEDE', 'PROPIETARIO'] },
  { a: '/ingresar', texto: 'Iniciar sesión', roles: 'invitado' },
  { a: '/registro', texto: 'Crear cuenta', roles: 'invitado' },
];

export function Layout() {
  const { usuario, cerrarSesion } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { pathname } = useLocation();
  const navegar = useNavigate();

  // Al cambiar de página se lleva el foco al contenido, para que el lector de pantalla anuncie la nueva página.
  // En la primera carga no: el navegador ya anuncia la página, y se compara con la ruta anterior (no con un
  // "ya montó") porque StrictMode ejecuta el efecto dos veces al montar.
  const rutaAnterior = useRef(pathname);
  useEffect(() => {
    if (rutaAnterior.current === pathname) return;
    rutaAnterior.current = pathname;
    document.getElementById('contenido')?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [pathname]);

  const visibles = ENLACES.filter((e) =>
    e.roles === undefined ? true : e.roles === 'invitado' ? !usuario : !!usuario && e.roles.includes(usuario.rol),
  );
  // Las herramientas de gestión van en su propia barra: son hasta 8 enlaces y no caben junto a los del sitio.
  const sitio = visibles.filter((e) => !e.a.startsWith('/panel'));
  const panel = visibles.filter((e) => e.a.startsWith('/panel'));

  return (
    <>
      <a className="saltar-contenido" href="#contenido">
        Saltar al contenido
      </a>
      <header className="encabezado">
        <div className="encabezado__interior">
          <Link to="/" className="marca">
            <img src="/favicon.svg" alt="" width="34" height="34" />
            Canchas Jireh
          </Link>
          <button
            type="button"
            className="menu-boton"
            aria-expanded={menuAbierto}
            aria-controls="navegacion"
            onClick={() => setMenuAbierto((v) => !v)}
          >
            Menú
          </button>
          <nav id="navegacion" className="navegacion" aria-label="Principal" data-abierta={menuAbierto}>
            <ul>
              {sitio.map((e) => (
                <li key={e.a}>
                  <NavLink to={e.a} end={e.a === '/'} onClick={() => setMenuAbierto(false)}>
                    {e.texto}
                  </NavLink>
                </li>
              ))}
              {usuario && (
                <>
                  <li className="usuario-actual" aria-label="Sesión iniciada">
                    {usuario.nombre} · {ROLES[usuario.rol]}
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={async () => {
                        setMenuAbierto(false);
                        await cerrarSesion();
                        navegar('/');
                      }}
                    >
                      Cerrar sesión
                    </button>
                  </li>
                </>
              )}
            </ul>
          </nav>
        </div>
      </header>
      {panel.length > 0 && (
        <nav className="subnav" aria-label="Herramientas de gestión">
          <ul>
            {panel.map((e) => (
              <li key={e.a}>
                <NavLink to={e.a}>{e.texto}</NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
      <main id="contenido" className="principal" tabIndex={-1}>
        <Suspense fallback={<Cargando />}>
          <Outlet />
        </Suspense>
      </main>
      <footer className="pie">
        © {new Date().getFullYear()} Canchas Jireh · Precios en quetzales (GTQ) · Horario de Guatemala
      </footer>
    </>
  );
}
