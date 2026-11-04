// Tipos de los datos que devuelve la API (/api).

export type Rol = 'CLIENTE' | 'ADMIN_SEDE' | 'PROPIETARIO';
export type Deporte = 'FUTBOL' | 'BASQUETBOL' | 'VOLEIBOL';
export type TipoDia = 'ENTRE_SEMANA' | 'FIN_DE_SEMANA';
export type EstadoReserva = 'PENDIENTE' | 'CONFIRMADA' | 'COMPLETADA' | 'CANCELADA' | 'EXPIRADA' | 'NO_SE_PRESENTO';
export type EstadoPago = 'PENDIENTE' | 'CONFIRMADO' | 'RECHAZADO' | 'REEMBOLSADO';
export type MetodoPago = 'TARJETA_SIMULADA' | 'TRANSFERENCIA' | 'EFECTIVO';
export type EstadoHorario = 'DISPONIBLE' | 'OCUPADO' | 'BLOQUEADO' | 'PASADO' | 'SIN_TARIFA';

export interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  telefono: string;
  rol: Rol;
  sedeId: string | null;
  activo: boolean;
  creadoEn: string;
}

export interface Sede {
  id: string;
  nombre: string;
  direccion: string;
  zona: string;
  telefono: string;
  horaApertura: string;
  horaCierre: string;
  activa: boolean;
}

export interface Cancha {
  id: string;
  sedeId: string;
  nombre: string;
  deporte: Deporte;
  superficie: string;
  capacidad: number;
  activa: boolean;
  sede?: Pick<Sede, 'id' | 'nombre'>;
}

export interface Tarifa {
  id: string;
  canchaId: string;
  tipoDia: TipoDia;
  horaInicio: string;
  horaFin: string;
  precioHora: number;
  vigenteDesde: string;
  vigenteHasta: string | null;
}

export interface Bloqueo {
  id: string;
  canchaId: string;
  inicio: string;
  fin: string;
  motivo: string;
  cancha?: { id: string; nombre: string; sedeId: string };
}

export interface Horario {
  hora: string;
  inicio: string;
  fin: string;
  estado: EstadoHorario;
  precio: number | null;
}

export interface Disponibilidad {
  fecha: string;
  sede: Pick<Sede, 'id' | 'nombre' | 'horaApertura' | 'horaCierre'>;
  canchas: (Pick<Cancha, 'id' | 'nombre' | 'deporte' | 'superficie' | 'capacidad'> & { horarios: Horario[] })[];
}

export interface Reserva {
  id: string;
  usuarioId: string;
  usuarioNombre: string;
  canchaId: string;
  canchaNombre: string;
  sedeId: string;
  sedeNombre: string;
  deporte: Deporte;
  inicio: string;
  fin: string;
  estado: EstadoReserva;
  precioTotal: number;
  expiraEn: string | null;
  canceladaEn: string | null;
  motivoCancelacion: string | null;
  porcentajeReembolso: number | null;
  creadoEn: string;
}

export interface VistaCancelacion {
  horasAntes: number;
  porcentajeReembolso: number;
  montoReembolso: number;
  pagada: boolean;
}

export interface ReglaReembolso {
  horasAntes: number;
  porcentajeReembolso: number;
}

export interface Reembolso {
  id: string;
  monto: number;
  porcentaje: number;
  motivo: string;
  creadoEn: string;
}

export interface Pago {
  id: string;
  reservaId: string;
  usuarioId: string;
  monto: number;
  metodo: MetodoPago;
  estado: EstadoPago;
  comprobanteUrl: string | null;
  referenciaBanco: string | null;
  ultimos4: string | null;
  motivoRechazo: string | null;
  creadoEn: string;
  reembolsos?: Reembolso[];
}

export interface ReporteIngresos {
  desde: string;
  hasta: string;
  sedes: {
    sedeId: string;
    pagos: number;
    cobrado: number;
    reembolsado: number;
    neto: number;
    porMetodo: Partial<Record<MetodoPago, number>>;
  }[];
}

export interface ReporteOcupacion {
  desde: string;
  hasta: string;
  sedes: {
    sedeId: string;
    sedeNombre: string;
    canchas: number;
    horasDisponibles: number;
    horasOcupadas: number;
    porcentajeOcupacion: number;
    reservasPorEstado: Partial<Record<EstadoReserva, number>>;
  }[];
}
