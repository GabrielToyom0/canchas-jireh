import { prisma, type Db } from '../config/database.js';
import { env } from '../config/env.js';
import { ESTADOS_RESERVA_ACTIVOS, type EstadoReserva } from '../models/enums.js';
import type { NuevaReserva, ReservaConDetalle } from '../models/reserva.model.js';
import { tarifaJson } from '../models/tarifa.model.js';
import type { UsuarioToken } from '../models/usuario.model.js';
import { canchaRepository } from '../repositories/cancha.repository.js';
import { reservaRepository } from '../repositories/reserva.repository.js';
import { porcentajeDe } from '../utils/dinero.js';
import { conflicto, noEncontrado, prohibido, reglaNegocio } from '../utils/errores.js';
import { aUtc, HORA_MS, hoyLocal, rangoDelDia, sumarDias } from '../utils/fechas.js';
import { exigirGestionSede } from '../utils/permisos.js';
import { notificacionService } from './notificacion.service.js';
import { politicaService } from './politica.service.js';
import { reembolsoService } from './reembolso.service.js';
import { dentroDeHorario, hayTraslape } from './reglas/horario.js';
import { calcularPrecio } from './reglas/precio.js';
import { horasHasta, porcentajeReembolso } from './reglas/reembolso.js';

/** Errores de SQL Server que indican que otra transacción ganó el horario. */
function esChoqueConcurrente(err: unknown): boolean {
  const texto = String((err as Error)?.message ?? '') + JSON.stringify(err ?? {});
  return /51000|RN-01|deadlock|1205|P2034/i.test(texto);
}

const nuevoPlazo = () => new Date(Date.now() + env.RESERVA_EXPIRA_MIN * 60_000);

async function recargar(id: string, db: Db = prisma): Promise<ReservaConDetalle> {
  const reserva = await reservaRepository.buscarPorId(id, db);
  if (!reserva) throw noEncontrado('Reserva');
  return reserva;
}

export const reservaService = {
  /**
   * HU-03 / RF-08 / RF-09: crea una reserva PENDIENTE con el precio calculado.
   * La garantía contra traslapes vive en la base de datos (RNF-02):
   * - transacción SERIALIZABLE con UPDLOCK + HOLDLOCK sobre el rango de la cancha, y
   * - un trigger que rechaza cualquier traslape aunque otro código inserte directo.
   */
  async crear(usuario: UsuarioToken, datos: NuevaReserva): Promise<ReservaConDetalle> {
    if (datos.fecha < hoyLocal()) throw reglaNegocio('No se puede reservar en fechas pasadas');
    if (datos.fecha > sumarDias(hoyLocal(), env.MAX_DIAS_ANTICIPACION)) {
      throw reglaNegocio(`Solo se puede reservar con hasta ${env.MAX_DIAS_ANTICIPACION} días de anticipación`);
    }
    const inicio = aUtc(datos.fecha, datos.horaInicio);
    const fin = new Date(inicio.getTime() + datos.horas * HORA_MS);
    if (inicio <= new Date()) throw reglaNegocio('El horario ya pasó');

    const cancha = await canchaRepository.conDetalle(datos.canchaId, inicio, fin);
    if (!cancha) throw noEncontrado('Cancha');
    if (!cancha.activa || !cancha.sede.activa) throw reglaNegocio('La cancha no está disponible');
    if (!dentroDeHorario(cancha.sede, datos.horaInicio, datos.horas)) {
      throw reglaNegocio(`Fuera del horario de la sede (${cancha.sede.horaApertura} a ${cancha.sede.horaCierre})`);
    }
    if (hayTraslape({ inicio, fin }, cancha.bloqueos)) {
      throw conflicto('El horario está bloqueado por la sede', 'HORARIO_BLOQUEADO');
    }
    // RN-05: el precio se calcula y queda fijo en la reserva.
    const precioTotal = calcularPrecio(cancha.tarifas.map(tarifaJson), datos.fecha, datos.horaInicio, datos.horas);
    if (precioTotal === null) throw reglaNegocio('No hay tarifa vigente para ese horario');

    try {
      return await prisma.$transaction(
        async (tx) => {
          if ((await reservaRepository.contarActivasConBloqueo(cancha.id, inicio, fin, tx)) > 0) {
            throw conflicto('El horario ya fue reservado', 'HORARIO_OCUPADO');
          }
          return reservaRepository.crear(
            {
              usuarioId: usuario.id,
              canchaId: cancha.id,
              sedeId: cancha.sedeId,
              inicio,
              fin,
              precioTotal,
              expiraEn: nuevoPlazo(),
            },
            tx,
          );
        },
        // Las solicitudes por el mismo horario esperan en fila al bloqueo: se les da tiempo para entrar.
        { isolationLevel: 'Serializable', maxWait: 10_000, timeout: 10_000 },
      );
    } catch (err) {
      if (esChoqueConcurrente(err)) throw conflicto('El horario ya fue reservado', 'HORARIO_OCUPADO');
      throw err;
    }
  },

  /** El cliente ve sus reservas; administradores y propietario, las de las sedes que gestionan. */
  async obtenerConAcceso(usuario: UsuarioToken, id: string): Promise<ReservaConDetalle> {
    const reserva = await recargar(id);
    if (usuario.rol === 'CLIENTE') {
      if (reserva.usuarioId !== usuario.id) throw prohibido('La reserva no le pertenece');
    } else {
      exigirGestionSede(usuario, reserva.sedeId);
    }
    return reserva;
  },

  /** HU-07: historial del cliente. */
  misReservas: (usuario: UsuarioToken, estado?: EstadoReserva) => reservaRepository.listarDeUsuario(usuario.id, estado),

  /** HU-09 / RF-13: calendario de una sede por día. */
  calendario(usuario: UsuarioToken, sedeId: string, fecha: string) {
    exigirGestionSede(usuario, sedeId);
    const { desde, hasta } = rangoDelDia(fecha);
    return reservaRepository.calendario(sedeId, desde, hasta);
  },

  /** HU-06: cuánto se reembolsaría si se cancela ahora. */
  async vistaPreviaCancelacion(usuario: UsuarioToken, reserva: ReservaConDetalle) {
    const horasAntes = horasHasta(reserva.inicio);
    // Si la sede cancela (administrador o propietario) se devuelve el 100 %.
    const porcentaje =
      usuario.rol === 'CLIENTE'
        ? porcentajeReembolso(await politicaService.reglasDeSede(reserva.sedeId), horasAntes)
        : 100;
    const pagada = reserva.estado === 'CONFIRMADA';
    return {
      horasAntes: Math.max(0, Math.floor(horasAntes)),
      porcentajeReembolso: porcentaje,
      montoReembolso: pagada ? porcentajeDe(Number(reserva.precioTotal), porcentaje) : 0,
      pagada,
    };
  },

  /**
   * RF-10 / paso 6 de la Tabla 8: cancela, reembolsa y encola el aviso en UNA transacción.
   * O se registran los tres cambios o ninguno.
   */
  async cancelar(usuario: UsuarioToken, reserva: ReservaConDetalle, motivo: string): Promise<ReservaConDetalle> {
    if (!ESTADOS_RESERVA_ACTIVOS.includes(reserva.estado as EstadoReserva)) {
      throw conflicto('Solo se pueden cancelar reservas pendientes o confirmadas', 'ESTADO_INVALIDO');
    }
    if (reserva.inicio <= new Date()) throw reglaNegocio('La reserva ya inició; no se puede cancelar');
    const { porcentajeReembolso: porcentaje } = await reservaService.vistaPreviaCancelacion(usuario, reserva);

    return prisma.$transaction(async (tx) => {
      const cancelada = await reservaRepository.transicionar(
        reserva.id,
        ESTADOS_RESERVA_ACTIVOS,
        {
          estado: 'CANCELADA',
          canceladaEn: new Date(),
          motivoCancelacion: motivo,
          porcentajeReembolso: porcentaje,
          expiraEn: null,
        },
        tx,
      );
      if (!cancelada) throw conflicto('La reserva cambió de estado; recargue e intente de nuevo', 'ESTADO_INVALIDO');
      await reembolsoService.procesarCancelacion(reserva.id, porcentaje, motivo, tx);
      await notificacionService.encolar(
        'RESERVA_CANCELADA',
        reserva.id,
        { motivo, porcentajeReembolso: porcentaje },
        tx,
      );
      return recargar(reserva.id, tx);
    });
  },

  /**
   * RF-11: PENDIENTE → CONFIRMADA y encola el correo de confirmación (HU-05).
   * Recibe la transacción del llamador (pago con tarjeta, verificación o confirmación manual).
   * Devuelve null si la reserva ya no estaba pendiente.
   */
  async confirmar(id: string, tx: Db): Promise<ReservaConDetalle | null> {
    if (!(await reservaRepository.transicionar(id, ['PENDIENTE'], { estado: 'CONFIRMADA', expiraEn: null }, tx))) {
      return null;
    }
    await notificacionService.encolar('RESERVA_CONFIRMADA', id, {}, tx);
    return recargar(id, tx);
  },

  /** RF-11: confirmación manual del administrador (por ejemplo, pago en efectivo en la sede). */
  async confirmarManual(reserva: ReservaConDetalle): Promise<ReservaConDetalle> {
    const confirmada = await prisma.$transaction((tx) => reservaService.confirmar(reserva.id, tx));
    if (!confirmada) throw conflicto('Solo se pueden confirmar reservas pendientes', 'ESTADO_INVALIDO');
    return confirmada;
  },

  /** RN-03: la reserva puede terminar como "no se presentó". */
  async marcarNoSePresento(reserva: ReservaConDetalle): Promise<ReservaConDetalle> {
    if (reserva.inicio > new Date()) throw reglaNegocio('La reserva aún no inicia');
    if (
      !(await reservaRepository.transicionar(reserva.id, ['CONFIRMADA', 'COMPLETADA'], { estado: 'NO_SE_PRESENTO' }))
    ) {
      throw conflicto('Solo aplica a reservas confirmadas', 'ESTADO_INVALIDO');
    }
    return recargar(reserva.id);
  },

  /** RN-04 / RN-08: transferencia o efectivo en verificación: la reserva deja de expirar. */
  suspenderExpiracion: (id: string, tx: Db) => reservaRepository.suspenderExpiracion(id, tx),

  /** Si el pago se rechaza, el cliente vuelve a tener el plazo completo para pagar. */
  reanudarExpiracion: (id: string, tx: Db) => reservaRepository.reanudarExpiracion(id, nuevoPlazo(), tx),

  // ── Tareas del programador ──

  /** RN-04: libera la reserva y encola el aviso. Devuelve false si ya no estaba vencida. */
  expirar: (id: string, ahora = new Date()) =>
    prisma.$transaction(async (tx) => {
      if (!(await reservaRepository.expirarSiVencida(id, ahora, tx))) return false;
      await notificacionService.encolar('RESERVA_EXPIRADA', id, {}, tx);
      return true;
    }),

  /** RF-15: recordatorio antes del inicio (una sola vez por reserva). */
  recordar: (id: string) =>
    prisma.$transaction(async (tx) => {
      if (!(await reservaRepository.transicionar(id, ['CONFIRMADA'], { recordatorioEnviado: true }, tx))) return false;
      await notificacionService.encolar('RESERVA_RECORDATORIO', id, {}, tx);
      return true;
    }),
};
