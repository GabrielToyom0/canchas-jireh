import { access } from 'node:fs/promises';
import path from 'node:path';
import { prisma, type Db } from '../config/database.js';
import type { NuevoPago, Pago } from '../models/pago.model.js';
import type { UsuarioToken } from '../models/usuario.model.js';
import { pagoRepository } from '../repositories/pago.repository.js';
import { reservaRepository } from '../repositories/reserva.repository.js';
import { rutaComprobante, TIPOS_POR_EXTENSION } from '../middlewares/subidaComprobante.js';
import { conflicto, ErrorApp, noEncontrado, prohibido } from '../utils/errores.js';
import { exigirGestionSede, sedeDeConsulta } from '../utils/permisos.js';
import { reservaService } from './reserva.service.js';
import { simularCobro } from './reglas/tarjetaSimulada.js';

/** Índice filtrado UX_Pago_ReservaActiva: dos pagos simultáneos para la misma reserva. */
const esPagoDuplicado = (err: unknown) => /UX_Pago_ReservaActiva|2601|2627/.test(String((err as Error)?.message));

/**
 * Registra un pago dentro de una transacción después de validar la reserva:
 * debe ser del cliente, estar pendiente, seguir en plazo (RN-04) y no tener otro pago activo.
 * `despues` agrega los cambios de la reserva en la misma transacción.
 */
async function registrarPago(
  usuario: UsuarioToken,
  reservaId: string,
  datos: NuevoPago,
  despues: (pago: Pago, tx: Db) => Promise<void> = async () => {},
): Promise<Pago> {
  try {
    return await prisma.$transaction(async (tx) => {
      const reserva = await reservaRepository.buscarPorId(reservaId, tx);
      if (!reserva) throw noEncontrado('Reserva');
      if (reserva.usuarioId !== usuario.id) throw prohibido('La reserva no le pertenece');
      if (reserva.estado !== 'PENDIENTE')
        throw conflicto('La reserva no está pendiente de pago', 'RESERVA_NO_PENDIENTE');
      if (reserva.expiraEn && reserva.expiraEn < new Date()) {
        throw conflicto('El plazo para pagar la reserva expiró', 'RESERVA_EXPIRADA');
      }
      if (await pagoRepository.activoDeReserva(reservaId, tx)) {
        throw conflicto('La reserva ya tiene un pago registrado', 'PAGO_EXISTENTE');
      }
      const pago = await pagoRepository.crear(
        {
          reservaId,
          usuarioId: usuario.id,
          monto: reserva.precioTotal,
          ...datos,
          confirmadoEn: datos.estado === 'CONFIRMADO' ? new Date() : null,
        },
        tx,
      );
      await despues(pago, tx);
      return pago;
    });
  } catch (err) {
    if (esPagoDuplicado(err)) throw conflicto('La reserva ya tiene un pago registrado', 'PAGO_EXISTENTE');
    throw err;
  }
}

async function suspenderPlazo(pago: Pago, tx: Db) {
  // Si el programador la expiró entre la validación y este punto, se revierte el pago.
  if (!(await reservaService.suspenderExpiracion(pago.reservaId, tx))) {
    throw conflicto('La reserva ya no está pendiente de pago', 'RESERVA_NO_PENDIENTE');
  }
}

export const pagoService = {
  /**
   * HU-04 / RF-14 / RN-08: la tarjeta simulada confirma de inmediato.
   * Pago y confirmación van en la misma transacción (pasos 3 y 4 de la Tabla 8).
   */
  async pagarConTarjeta(usuario: UsuarioToken, reservaId: string, numero: string): Promise<Pago> {
    const cobro = simularCobro(numero);
    const pago = await registrarPago(
      usuario,
      reservaId,
      {
        metodo: 'TARJETA_SIMULADA',
        estado: cobro.aprobado ? 'CONFIRMADO' : 'RECHAZADO',
        ultimos4: numero.slice(-4),
        motivoRechazo: cobro.aprobado ? undefined : cobro.motivo,
      },
      async (p, tx) => {
        if (p.estado !== 'CONFIRMADO') return;
        if (!(await reservaService.confirmar(reservaId, tx))) {
          throw conflicto('La reserva ya no está pendiente de pago', 'RESERVA_NO_PENDIENTE');
        }
      },
    );
    // El intento rechazado queda registrado en el historial y el cliente puede reintentar.
    if (!cobro.aprobado) throw new ErrorApp(402, 'PAGO_RECHAZADO', cobro.motivo);
    return pago;
  },

  /** Transferencia: el cliente sube el comprobante y un administrador lo verifica. */
  pagarConTransferencia: (usuario: UsuarioToken, reservaId: string, comprobanteUrl: string, referenciaBanco: string) =>
    registrarPago(
      usuario,
      reservaId,
      { metodo: 'TRANSFERENCIA', estado: 'PENDIENTE', comprobanteUrl, referenciaBanco },
      suspenderPlazo,
    ),

  /** Efectivo: se paga en la sede y el administrador lo verifica. */
  pagarEnEfectivo: (usuario: UsuarioToken, reservaId: string) =>
    registrarPago(usuario, reservaId, { metodo: 'EFECTIVO', estado: 'PENDIENTE' }, suspenderPlazo),

  /** HU-07: historial de pagos del cliente, con sus reembolsos. */
  misPagos: (usuario: UsuarioToken) => pagoRepository.listarDeUsuario(usuario.id),

  /** HU-10: pagos en verificación de la sede que gestiona el usuario. */
  pendientes: (usuario: UsuarioToken, sedeId?: string) => pagoRepository.pendientes(sedeDeConsulta(usuario, sedeId)),

  /** Pagos de una reserva (cliente dueño o gestor de la sede). */
  async deReserva(usuario: UsuarioToken, reservaId: string) {
    await reservaService.obtenerConAcceso(usuario, reservaId);
    return pagoRepository.deReserva(reservaId);
  },

  /**
   * HU-10 / RN-08: el administrador aprueba (confirma la reserva) o rechaza (la reserva
   * vuelve a tener plazo para pagar). Todo en una transacción.
   */
  async verificar(usuario: UsuarioToken, pagoId: string, aprobar: boolean, motivo?: string): Promise<Pago> {
    const pago = await pagoRepository.buscarPorId(pagoId);
    if (!pago) throw noEncontrado('Pago');
    exigirGestionSede(usuario, pago.reserva.sedeId);
    if (pago.estado !== 'PENDIENTE') throw conflicto('El pago ya fue verificado', 'PAGO_YA_VERIFICADO');

    return prisma.$transaction(async (tx) => {
      const ahora = new Date();
      const actualizado = await pagoRepository.actualizarPendiente(
        pagoId,
        {
          estado: aprobar ? 'CONFIRMADO' : 'RECHAZADO',
          verificadoPor: usuario.id,
          verificadoEn: ahora,
          confirmadoEn: aprobar ? ahora : null,
          motivoRechazo: aprobar ? null : motivo,
        },
        tx,
      );
      if (!actualizado) throw conflicto('El pago ya fue verificado', 'PAGO_YA_VERIFICADO');
      if (aprobar) {
        const confirmada = await reservaService.confirmar(pago.reservaId, tx);
        // Si un administrador ya la había confirmado a mano, el pago solo se registra.
        const reserva = confirmada ?? (await reservaRepository.buscarPorId(pago.reservaId, tx));
        if (reserva?.estado !== 'CONFIRMADA') {
          throw conflicto('La reserva ya no está pendiente de pago', 'RESERVA_NO_PENDIENTE');
        }
      } else {
        await reservaService.reanudarExpiracion(pago.reservaId, tx);
      }
      const resultado = await pagoRepository.buscarPorId(pagoId, tx);
      return resultado!;
    });
  },

  /** Ruta y tipo del comprobante, si el usuario puede verlo. */
  async comprobante(usuario: UsuarioToken, pagoId: string) {
    const pago = await pagoRepository.buscarPorId(pagoId);
    if (!pago?.comprobanteUrl) throw noEncontrado('Comprobante');
    if (usuario.rol === 'CLIENTE') {
      if (pago.usuarioId !== usuario.id) throw prohibido();
    } else {
      exigirGestionSede(usuario, pago.reserva.sedeId);
    }
    const ruta = rutaComprobante(pago.comprobanteUrl);
    await access(ruta).catch(() => {
      throw noEncontrado('Comprobante');
    });
    const extension = path.extname(ruta);
    return { ruta, extension, tipo: TIPOS_POR_EXTENSION[extension] ?? 'application/octet-stream' };
  },
};
