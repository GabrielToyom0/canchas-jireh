import { expect, test } from '@playwright/test';
import { CUENTAS, iniciarSesion, registrarCliente } from './utilidades';

// Roles y permisos (Tabla 2, RN-07) desde la interfaz.
test.describe('Gestión por rol', () => {
  test('el administrador ve el calendario y solo su sede', async ({ page }) => {
    await iniciarSesion(page, CUENTAS.adminZona10);
    await expect(page).toHaveURL(/\/panel\/calendario$/);
    await expect(page.getByLabel('Sede')).toBeDisabled();
    await expect(page.getByLabel('Sede')).toHaveValue(/.+/);
    await expect(page.getByRole('table', { name: 'Reservas y bloqueos por cancha y hora' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sedes' })).toHaveCount(0);
  });

  test('el propietario ve los reportes consolidados', async ({ page }) => {
    await iniciarSesion(page, CUENTAS.propietario);
    await expect(page).toHaveURL(/\/panel\/reportes$/);
    await expect(page.getByText('Ingreso neto')).toBeVisible();
    await expect(page.getByRole('table', { name: 'Detalle por sede' })).toContainText('Jireh Zona 10');
    await expect(page.getByRole('table', { name: 'Detalle por sede' })).toContainText('Jireh Mixco');
  });

  test('un cliente no puede abrir páginas de gestión', async ({ page }) => {
    await registrarCliente(page);
    await page.goto('/panel/sedes');
    await expect(page.getByRole('alert')).toHaveText('No tiene permiso para ver esta página.');
  });

  test('la sesión se mantiene al recargar la página', async ({ page }) => {
    await iniciarSesion(page, CUENTAS.cliente);
    await page.goto('/mis-reservas');
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Mis reservas' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cerrar sesión' })).toBeVisible();
  });
});
