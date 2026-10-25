// Valores de dominio. SQL Server no admite enums en Prisma, así que estos catálogos
// se validan en la aplicación con zod y en la base de datos con CHECK.

export const ROLES = ['CLIENTE', 'ADMIN_SEDE', 'PROPIETARIO'] as const;
export type Rol = (typeof ROLES)[number];

export const DEPORTES = ['FUTBOL', 'BASQUETBOL', 'VOLEIBOL'] as const;
export type Deporte = (typeof DEPORTES)[number];

export const TIPOS_DIA = ['ENTRE_SEMANA', 'FIN_DE_SEMANA'] as const;
export type TipoDia = (typeof TIPOS_DIA)[number];

// RN-03: ciclo de vida de una reserva.
export const ESTADOS_RESERVA = [
  'PENDIENTE',
  'CONFIRMADA',
  'COMPLETADA',
  'CANCELADA',
  'EXPIRADA',
  'NO_SE_PRESENTO',
] as const;
export type EstadoReserva = (typeof ESTADOS_RESERVA)[number];

// RN-01: estados que ocupan la cancha.
export const ESTADOS_RESERVA_ACTIVOS: EstadoReserva[] = ['PENDIENTE', 'CONFIRMADA'];

export const METODOS_PAGO = ['TARJETA_SIMULADA', 'TRANSFERENCIA', 'EFECTIVO'] as const;
export type MetodoPago = (typeof METODOS_PAGO)[number];

export const ESTADOS_PAGO = ['PENDIENTE', 'CONFIRMADO', 'RECHAZADO', 'REEMBOLSADO'] as const;
export type EstadoPago = (typeof ESTADOS_PAGO)[number];

export const TIPOS_NOTIFICACION = [
  'RESERVA_CONFIRMADA',
  'RESERVA_CANCELADA',
  'RESERVA_EXPIRADA',
  'RESERVA_RECORDATORIO',
  'PAGO_REEMBOLSADO',
] as const;
export type TipoNotificacion = (typeof TIPOS_NOTIFICACION)[number];
