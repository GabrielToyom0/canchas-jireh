import { expect, type Page } from '@playwright/test';

/** Cuentas creadas por `npm run db:seed`. */
export const CUENTAS = {
  propietario: {
    correo: process.env.E2E_PROPIETARIO_CORREO ?? 'propietario@canchasjireh.gt',
    password: process.env.E2E_PROPIETARIO_PASSWORD ?? 'Propietario2026',
  },
  adminZona10: { correo: 'admin.zona10@canchasjireh.gt', password: 'Demo2026!' },
  cliente: { correo: 'cliente@demo.gt', password: 'Demo2026!' },
};

export async function iniciarSesion(page: Page, cuenta: { correo: string; password: string }) {
  await page.goto('/ingresar');
  await page.getByLabel('Correo electrónico').fill(cuenta.correo);
  await page.getByLabel('Contraseña').fill(cuenta.password);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page.getByRole('button', { name: 'Cerrar sesión' })).toBeVisible();
}

/** Fecha local de Guatemala dentro de `dias` días (AAAA-MM-DD). */
export function fechaEn(dias: number): string {
  return new Date(Date.now() - 6 * 3_600_000 + dias * 86_400_000).toISOString().slice(0, 10);
}

/** Registra un cliente nuevo con un correo único. */
export async function registrarCliente(page: Page) {
  const correo = `e2e.${Date.now()}.${Math.floor(Math.random() * 1000)}@pruebas.gt`;
  await page.goto('/registro');
  await page.getByLabel('Nombre completo').fill('Cliente E2E');
  await page.getByLabel('Correo electrónico').fill(correo);
  await page.getByLabel('Teléfono').fill('5555-0000');
  await page.getByLabel(/^Contraseña/).fill('Prueba2026');
  await page.getByLabel('Confirmar contraseña').fill('Prueba2026');
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await expect(page.getByRole('button', { name: 'Cerrar sesión' })).toBeVisible();
  return correo;
}
