import { defineConfig, devices } from '@playwright/test';

/**
 * Pruebas E2E de los flujos de reserva y pago (RNF-05).
 * Requieren el sistema corriendo con los datos de demostración (npm run db:seed).
 *   Desarrollo: npm run dev        → http://localhost:5173 (por defecto)
 *   Docker:     npm run docker:up  → E2E_BASE_URL=http://localhost:8080
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  timeout: 45_000,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    locale: 'es-GT',
    timezoneId: 'America/Guatemala',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'escritorio', use: { ...devices['Desktop Chrome'] } },
    { name: 'movil', use: { ...devices['Pixel 7'] }, testMatch: /busqueda\.spec\.ts/ },
  ],
});
