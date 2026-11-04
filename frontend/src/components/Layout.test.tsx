import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Rol, Usuario } from '../types';
import { Layout } from './Layout';

const auth = vi.hoisted(() => ({ usuario: null as Usuario | null, cerrarSesion: vi.fn() }));
vi.mock('../context/AuthContext', () => ({ useAuth: () => auth }));

const conRol = (rol: Rol): Usuario => ({
  id: 'u1',
  nombre: 'Persona de prueba',
  correo: 'prueba@example.com',
  telefono: '5555-0000',
  rol,
  sedeId: null,
  activo: true,
  creadoEn: '2026-10-23T00:00:00Z',
});

const montar = (ruta = '/') =>
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <Layout />
    </MemoryRouter>,
  );

describe('Layout', () => {
  beforeEach(() => {
    // jsdom no implementa scrollTo.
    window.scrollTo = vi.fn();
  });

  it('el propietario ve las herramientas de gestión en su propia barra', () => {
    auth.usuario = conRol('PROPIETARIO');
    montar('/panel/reportes');
    const principal = screen.getByRole('navigation', { name: 'Principal' });
    const gestion = screen.getByRole('navigation', { name: 'Herramientas de gestión' });
    expect(within(principal).getByRole('link', { name: 'Buscar canchas' })).toBeInTheDocument();
    expect(within(principal).queryByRole('link', { name: 'Reportes' })).not.toBeInTheDocument();
    expect(within(gestion).getAllByRole('link')).toHaveLength(8);
    expect(within(gestion).getByRole('link', { name: 'Reportes' })).toHaveAttribute('aria-current', 'page');
  });

  it('un cliente no ve la barra de gestión', () => {
    auth.usuario = conRol('CLIENTE');
    montar();
    expect(screen.queryByRole('navigation', { name: 'Herramientas de gestión' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Mis reservas' })).toBeInTheDocument();
  });

  it('lleva el foco al contenido al navegar, pero no en la primera carga', async () => {
    auth.usuario = conRol('CLIENTE');
    montar();
    const contenido = screen.getByRole('main');
    expect(contenido).not.toHaveFocus();
    await userEvent.click(screen.getByRole('link', { name: 'Mis reservas' }));
    expect(contenido).toHaveFocus();
  });
});
