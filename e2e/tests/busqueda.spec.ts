import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { fechaEn } from './utilidades';

// HU-02 / RF-16: pantalla principal de búsqueda, también en celular.
test.describe('Búsqueda de disponibilidad', () => {
  test('muestra sedes, canchas y horarios con precio', async ({ page }) => {
    await page.goto(`/?fecha=${fechaEn(5)}`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Reserva tu cancha en minutos');
    await expect(page.getByLabel('Sede')).not.toHaveValue('');
    await expect(page.locator('article.cancha').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /^Reservar .* a las \d{2}:00 Q/ }).first()).toBeVisible();
  });

  test('filtra por deporte', async ({ page }) => {
    await page.goto(`/?fecha=${fechaEn(5)}`);
    await page.getByLabel('Sede').selectOption({ label: 'Jireh Zona 10 — Zona 10' });
    await expect(page.locator('article.cancha')).toHaveCount(3);
    const basquet = page.getByRole('radio', { name: 'Básquetbol' });
    await basquet.click();
    await expect(basquet).toBeChecked();
    await expect(page.locator('article.cancha')).toHaveCount(1);
    await expect(page.locator('article.cancha h3')).toHaveText('Básquet 1');
  });

  test('un visitante debe iniciar sesión para reservar', async ({ page }) => {
    await page.goto(`/?fecha=${fechaEn(5)}`);
    await page
      .getByRole('button', { name: /^Reservar / })
      .first()
      .click();
    await expect(page).toHaveURL(/\/ingresar$/);
    await expect(page.getByText('Inicie sesión para continuar con su reserva.')).toBeVisible();
  });

  test('cumple las reglas de accesibilidad WCAG 2.1 AA (axe)', async ({ page }) => {
    await page.goto(`/?fecha=${fechaEn(5)}`);
    await expect(page.locator('article.cancha').first()).toBeVisible();
    const resultado = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(resultado.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});
