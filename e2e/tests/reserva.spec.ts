import { expect, test, type Page } from '@playwright/test';
import { fechaEn, registrarCliente } from './utilidades';

/** Busca el primer horario libre de la sede y lo elige. */
async function elegirHorarioLibre(page: Page, dias: number) {
  await page.goto(`/?fecha=${fechaEn(dias)}`);
  await page.getByLabel('Sede').selectOption({ label: 'Jireh Zona 10 — Zona 10' });
  await page
    .getByRole('button', { name: /^Reservar / })
    .first()
    .click();
  await expect(page.getByRole('heading', { name: 'Confirmar reserva' })).toBeVisible();
}

async function pagarConTarjeta(page: Page, numero: string) {
  await page.getByLabel('Número de tarjeta').fill(numero);
  await page.getByLabel('Nombre del titular').fill('Cliente E2E');
  await page.getByLabel('Vencimiento (MM/AA)').fill('1230');
  await page.getByLabel('CVV').fill('123');
  await page.getByRole('button', { name: /^Pagar Q/ }).click();
}

// Flujo principal (Tabla 8): reservar → pagar → confirmar → cancelar con reembolso.
test.describe('Reserva y pago', () => {
  test('el cliente reserva, paga con tarjeta y la reserva queda confirmada', async ({ page }) => {
    await registrarCliente(page);
    await elegirHorarioLibre(page, 8);
    await page.getByRole('button', { name: /^Reservar y pagar/ }).click();

    await expect(page.getByRole('heading', { name: 'Pagar reserva' })).toBeVisible();
    await expect(page.getByText(/minutos para pagar/)).toBeVisible();

    // RN-08: una tarjeta rechazada muestra el error y permite reintentar.
    await pagarConTarjeta(page, '4000000000000002');
    await expect(page.getByRole('alert')).toContainText('rechazada');

    await pagarConTarjeta(page, '4242424242424242');
    await expect(page.getByRole('heading', { name: '¡Pago aprobado!' })).toBeVisible();
    await expect(page.getByText('Su reserva está confirmada')).toBeVisible();

    await page.getByRole('link', { name: 'Ver mis reservas' }).click();
    await expect(page.locator('article').first()).toContainText('Confirmada');
  });

  test('el cliente cancela y ve el reembolso antes de confirmar (HU-06)', async ({ page }) => {
    await registrarCliente(page);
    await elegirHorarioLibre(page, 9);
    await page.getByRole('button', { name: /^Reservar y pagar/ }).click();
    await pagarConTarjeta(page, '4242424242424242');
    await expect(page.getByText('Su reserva está confirmada')).toBeVisible();

    await page.goto('/mis-reservas');
    await page.getByRole('button', { name: 'Cancelar' }).first().click();
    const dialogo = page.getByRole('dialog', { name: 'Cancelar reserva' });
    await expect(dialogo).toContainText('100 %');
    await dialogo.getByRole('button', { name: 'Sí, cancelar reserva' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Reserva cancelada' })).toBeVisible();

    // El reembolso se registra en la misma transacción que la cancelación.
    await page.goto('/mis-pagos');
    await expect(page.getByRole('cell', { name: 'Reembolsado' })).toBeVisible();
  });

  test('transferencia con comprobante queda en verificación', async ({ page }) => {
    await registrarCliente(page);
    await elegirHorarioLibre(page, 10);
    await page.getByRole('button', { name: /^Reservar y pagar/ }).click();
    await page.getByRole('radio', { name: 'Transferencia' }).check();
    await page.getByLabel('Número de referencia de la transferencia').fill('TRF-E2E-001');
    await page.getByLabel(/Comprobante/).setInputFiles({
      name: 'comprobante.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4\n% comprobante de prueba\n'),
    });
    await page.getByRole('button', { name: 'Enviar comprobante' }).click();
    await expect(page.getByRole('heading', { name: 'Pago registrado' })).toBeVisible();
    await expect(page.getByText(/Un administrador lo verificará/)).toBeVisible();
  });
});
