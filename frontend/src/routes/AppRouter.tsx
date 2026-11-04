import { lazy } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { Layout } from '../components/Layout';
import { RutaProtegida } from './RutaProtegida';
import { rutas } from './rutas';

const NoEncontradaPage = lazy(() => import('../pages/publico/NoEncontradaPage'));

const enrutador = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      ...rutas.map(({ path, index, element, roles }) => {
        const contenido = roles ? <RutaProtegida roles={roles}>{element}</RutaProtegida> : element;
        return index ? { index: true, element: contenido } : { path, element: contenido };
      }),
      { path: '*', element: <NoEncontradaPage /> },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={enrutador} />;
}
