import { lazy } from 'react';
import { BusquedaPage } from '../pages/publico/BusquedaPage';
import { GESTORES, type RutaApp } from './tipos';

// La búsqueda es la pantalla principal (RF-16): va en el paquete inicial para que cargue rápido.
// El resto de páginas se descarga solo cuando se visita (división de código).
const LoginPage = lazy(() => import('../pages/publico/LoginPage'));
const RegistroPage = lazy(() => import('../pages/publico/RegistroPage'));

const ReservarPage = lazy(() => import('../pages/cliente/ReservarPage'));
const PagoPage = lazy(() => import('../pages/cliente/PagoPage'));
const MisReservasPage = lazy(() => import('../pages/cliente/MisReservasPage'));
const MisPagosPage = lazy(() => import('../pages/cliente/MisPagosPage'));

const CalendarioPage = lazy(() => import('../pages/admin/CalendarioPage'));
const VerificarPagosPage = lazy(() => import('../pages/admin/VerificarPagosPage'));
const CanchasPage = lazy(() => import('../pages/admin/CanchasPage'));
const BloqueosPage = lazy(() => import('../pages/admin/BloqueosPage'));

const SedesPage = lazy(() => import('../pages/propietario/SedesPage'));
const AdministradoresPage = lazy(() => import('../pages/propietario/AdministradoresPage'));
const PoliticasPage = lazy(() => import('../pages/propietario/PoliticasPage'));
const ReportesPage = lazy(() => import('../pages/propietario/ReportesPage'));

/** Todas las páginas del sitio. `roles` exige sesión con uno de esos roles (el backend vuelve a validar). */
export const rutas: RutaApp[] = [
  // Público
  { index: true, element: <BusquedaPage /> },
  { path: 'ingresar', element: <LoginPage /> },
  { path: 'registro', element: <RegistroPage /> },

  // Cliente
  { path: 'reservar', element: <ReservarPage />, roles: ['CLIENTE'] },
  { path: 'reservas/:id/pagar', element: <PagoPage />, roles: ['CLIENTE'] },
  { path: 'mis-reservas', element: <MisReservasPage />, roles: ['CLIENTE'] },
  { path: 'mis-pagos', element: <MisPagosPage />, roles: ['CLIENTE'] },

  // Administrador de sede y propietario
  { path: 'panel/calendario', element: <CalendarioPage />, roles: GESTORES },
  { path: 'panel/pagos', element: <VerificarPagosPage />, roles: GESTORES },
  { path: 'panel/canchas', element: <CanchasPage />, roles: GESTORES },
  { path: 'panel/bloqueos', element: <BloqueosPage />, roles: GESTORES },
  { path: 'panel/reportes', element: <ReportesPage />, roles: GESTORES },

  // Solo propietario
  { path: 'panel/sedes', element: <SedesPage />, roles: ['PROPIETARIO'] },
  { path: 'panel/administradores', element: <AdministradoresPage />, roles: ['PROPIETARIO'] },
  { path: 'panel/politicas', element: <PoliticasPage />, roles: ['PROPIETARIO'] },
];
