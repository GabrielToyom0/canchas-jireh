import { execSync } from 'node:child_process';

/** Crea la base de pruebas (si no existe) y aplica las migraciones, incluido el trigger anti-traslapes. */
export default function prepararBaseDePruebas() {
  const url =
    process.env.DATABASE_URL_PRUEBAS ??
    'sqlserver://localhost:1433;database=CanchasJirehPruebasDB;user=sa;password=Cambiar_Esta_Clave1;trustServerCertificate=true';
  execSync('npx prisma migrate deploy', { env: { ...process.env, DATABASE_URL: url }, stdio: 'inherit' });
}
