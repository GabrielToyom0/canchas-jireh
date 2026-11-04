import { defineConfig } from 'vitest/config';

// Pruebas de integración contra SQL Server real (RNF-02). Requieren la base levantada:
//   npm run dev:infra && npm run test:integracion
const DATABASE_URL =
  process.env.DATABASE_URL_PRUEBAS ??
  'sqlserver://localhost:1433;database=CanchasJirehPruebasDB;user=sa;password=Cambiar_Esta_Clave1;trustServerCertificate=true';

export default defineConfig({
  test: {
    include: ['tests/**/*.int.test.ts'],
    globalSetup: ['./tests/integration/preparar-bd.ts'],
    testTimeout: 60_000,
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      JWT_ACCESS_SECRET: 'secreto-de-pruebas-1234567890',
      DATABASE_URL,
    },
  },
});
