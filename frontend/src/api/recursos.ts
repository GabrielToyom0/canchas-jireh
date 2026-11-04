import type {
  Bloqueo,
  Cancha,
  Deporte,
  Disponibilidad,
  Pago,
  ReglaReembolso,
  ReporteIngresos,
  ReporteOcupacion,
  Reserva,
  Sede,
  Tarifa,
  Usuario,
  VistaCancelacion,
} from '../types';
import { api, solicitar, type Sesion } from './cliente';

const consulta = (params: Record<string, string | undefined | boolean>) => {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') q.set(k, String(v));
  const texto = q.toString();
  return texto ? `?${texto}` : '';
};

export const authApi = {
  login: (correo: string, password: string) =>
    solicitar<Sesion>('/auth/login', { metodo: 'POST', cuerpo: { correo, password }, sinRenovar: true }),
  registro: (datos: { nombre: string; correo: string; telefono: string; password: string }) =>
    solicitar<Sesion>('/auth/registro', { metodo: 'POST', cuerpo: datos, sinRenovar: true }),
  logout: () => solicitar<void>('/auth/logout', { metodo: 'POST', cuerpo: {}, sinRenovar: true }),
};

export const sedesApi = {
  listar: (incluirInactivas = false) =>
    api.get<Sede[]>(`/sedes${consulta({ incluirInactivas: incluirInactivas || undefined })}`),
  crear: (datos: Omit<Sede, 'id' | 'activa'>) => api.post<Sede>('/sedes', datos),
  actualizar: (id: string, datos: Partial<Sede>) => api.patch<Sede>(`/sedes/${id}`, datos),
};

export const canchasApi = {
  listar: (filtros: { sedeId?: string; deporte?: Deporte; incluirInactivas?: boolean } = {}) =>
    api.get<Cancha[]>(`/canchas${consulta(filtros)}`),
  obtener: (id: string) => api.get<Cancha & { sede: Sede }>(`/canchas/${id}`),
  crear: (datos: Omit<Cancha, 'id' | 'activa' | 'sede'>) => api.post<Cancha>('/canchas', datos),
  actualizar: (id: string, datos: Partial<Cancha>) => api.patch<Cancha>(`/canchas/${id}`, datos),
  tarifas: (id: string) => api.get<Tarifa[]>(`/canchas/${id}/tarifas`),
  crearTarifa: (id: string, datos: Omit<Tarifa, 'id' | 'canchaId'>) =>
    api.post<Tarifa>(`/canchas/${id}/tarifas`, datos),
  actualizarTarifa: (id: string, datos: Partial<Tarifa>) => api.patch<Tarifa>(`/tarifas/${id}`, datos),
  eliminarTarifa: (id: string) => api.delete(`/tarifas/${id}`),
};

export const bloqueosApi = {
  listar: (filtros: { sedeId?: string; desde: string; hasta: string }) =>
    api.get<Bloqueo[]>(`/bloqueos${consulta(filtros)}`),
  crear: (datos: { canchaId: string; fecha: string; horaInicio: string; horaFin: string; motivo: string }) =>
    api.post<Bloqueo>('/bloqueos', datos),
  eliminar: (id: string) => api.delete(`/bloqueos/${id}`),
};

export const reservasApi = {
  disponibilidad: (filtros: { sedeId: string; fecha: string; deporte?: Deporte }) =>
    api.get<Disponibilidad>(`/disponibilidad${consulta(filtros)}`),
  crear: (datos: { canchaId: string; fecha: string; horaInicio: string; horas: number }) =>
    api.post<Reserva>('/reservas', datos),
  mias: () => api.get<Reserva[]>('/reservas/mias'),
  obtener: (id: string) => api.get<Reserva>(`/reservas/${id}`),
  calendario: (sedeId: string, fecha: string) =>
    api.get<Reserva[]>(`/reservas/calendario${consulta({ sedeId, fecha })}`),
  vistaCancelacion: (id: string) => api.get<VistaCancelacion>(`/reservas/${id}/cancelacion`),
  cancelar: (id: string, motivo: string) => api.post<Reserva>(`/reservas/${id}/cancelar`, { motivo }),
  confirmar: (id: string) => api.post<Reserva>(`/reservas/${id}/confirmar`),
  noSePresento: (id: string) => api.post<Reserva>(`/reservas/${id}/no-show`),
};

export const politicasApi = {
  obtener: (sedeId: string) => api.get<{ sedeId: string; reglas: ReglaReembolso[] }>(`/politicas/${sedeId}`),
  guardar: (sedeId: string, reglas: ReglaReembolso[]) =>
    api.put<{ reglas: ReglaReembolso[] }>(`/politicas/${sedeId}`, { reglas }),
};

export const pagosApi = {
  tarjeta: (datos: { reservaId: string; numero: string; titular: string; expiracion: string; cvv: string }) =>
    api.post<Pago>('/pagos/tarjeta', datos),
  transferencia: (formulario: FormData) => api.formulario<Pago>('/pagos/transferencia', formulario),
  efectivo: (reservaId: string) => api.post<Pago>('/pagos/efectivo', { reservaId }),
  mios: () => api.get<Pago[]>('/pagos/mios'),
  deReserva: (reservaId: string) => api.get<Pago[]>(`/pagos${consulta({ reservaId })}`),
  pendientes: (sedeId?: string) => api.get<Pago[]>(`/pagos/pendientes${consulta({ sedeId })}`),
  verificar: (id: string, aprobar: boolean, motivo?: string) =>
    api.post<Pago>(`/pagos/${id}/verificar`, { aprobar, motivo }),
};

export const reportesApi = {
  ingresos: (desde: string, hasta: string) =>
    api.get<ReporteIngresos>(`/reportes/ingresos${consulta({ desde, hasta })}`),
  ocupacion: (desde: string, hasta: string) =>
    api.get<ReporteOcupacion>(`/reportes/ocupacion${consulta({ desde, hasta })}`),
};

export const usuariosApi = {
  listar: (rol?: string) => api.get<Usuario[]>(`/usuarios${consulta({ rol })}`),
  crearAdmin: (datos: { nombre: string; correo: string; telefono: string; password: string; sedeId: string }) =>
    api.post<Usuario>('/usuarios/administradores', datos),
  actualizar: (id: string, datos: { activo?: boolean; sedeId?: string }) =>
    api.patch<Usuario>(`/usuarios/${id}`, datos),
};
