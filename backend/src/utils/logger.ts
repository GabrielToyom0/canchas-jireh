import { pino } from 'pino';

export const logger = pino({
  name: 'canchas-jireh',
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'test' ? 'silent' : 'info'),
  // Nunca registrar credenciales ni tokens.
  redact: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.passwordHash', '*.token'],
});
