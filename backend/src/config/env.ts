import { z } from 'zod';

const esquema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1),

  // Seguridad (RNF-01)
  JWT_ACCESS_SECRET: z.string().min(16, 'debe tener al menos 16 caracteres'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  REFRESH_TTL_DIAS: z.coerce.number().int().positive().default(7),
  /** En producción con HTTPS debe ser true. */
  COOKIE_SECURE: z.stringbool().default(false),
  /** Orígenes permitidos separados por coma. */
  CORS_ORIGIN: z
    .string()
    .default('http://localhost:5173')
    .transform((v) => v.split(',').map((o) => o.trim())),
  /** Peticiones por IP cada 15 minutos. */
  LIMITE_GENERAL: z.coerce.number().int().positive().default(600),
  /** Intentos de inicio de sesión y registro por IP cada 15 minutos. */
  LIMITE_AUTH: z.coerce.number().int().positive().default(20),

  // Cuenta del propietario que se crea al arrancar si no existe ninguna.
  PROPIETARIO_NOMBRE: z.string().default('Propietario Canchas Jireh'),
  PROPIETARIO_CORREO: z
    .email()
    .optional()
    .or(z.literal('').transform(() => undefined)),
  PROPIETARIO_PASSWORD: z
    .string()
    .min(8)
    .optional()
    .or(z.literal('').transform(() => undefined)),

  // Reglas de negocio
  /** RN-04: minutos para pagar antes de que la reserva se libere. */
  RESERVA_EXPIRA_MIN: z.coerce.number().int().positive().default(15),
  /** RF-15: horas antes del inicio en que se envía el recordatorio. */
  RECORDATORIO_HORAS: z.coerce.number().int().positive().default(24),
  /** Días hacia adelante que se pueden reservar. */
  MAX_DIAS_ANTICIPACION: z.coerce.number().int().positive().default(60),
  TAREAS_INTERVALO_MS: z.coerce.number().int().positive().default(30_000),

  // Comprobantes de transferencia
  UPLOADS_DIR: z.string().default('./uploads'),
  MAX_COMPROBANTE_MB: z.coerce.number().positive().default(5),

  // Correo: en desarrollo apunta a Mailpit, que atrapa los correos sin enviarlos.
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.coerce.number().default(1025),
  SMTP_SECURE: z.stringbool().default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  CORREO_REMITENTE: z.string().default('Canchas Jireh <no-responder@canchasjireh.gt>'),
  /** Dirección pública del sitio para los enlaces de los correos. */
  APP_URL: z.url().default('http://localhost:5173'),

  /** Carpeta del frontend compilado; si existe, Express la sirve (producción). */
  FRONTEND_DIST: z.string().optional(),
});

/** Valida las variables de entorno al arrancar y termina con un mensaje claro si falta alguna. */
function cargar() {
  const resultado = esquema.safeParse(process.env);
  if (!resultado.success) {
    const faltantes = resultado.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Variables de entorno inválidas:\n${faltantes}`);
  }
  return resultado.data;
}

export const env = cargar();
