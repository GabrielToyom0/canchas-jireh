import { defineConfig } from 'vitest/config';

// Variables de entorno de prueba: la configuración se valida al importarse.
// Las pruebas con base de datos real (*.int.test.ts) se ejecutan aparte: npm run test:integracion.
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/**/*.int.test.ts'],
    env: {
      NODE_ENV: 'test',
      JWT_ACCESS_SECRET: 'secreto-de-pruebas-1234567890',
      DATABASE_URL: 'sqlserver://localhost:1433;database=Pruebas;user=sa;password=x;trustServerCertificate=true',
    },
  },
});
