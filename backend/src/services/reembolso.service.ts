import type { Db } from '../config/database.js';
import { pagoRepository } from '../repositories/pago.repository.js';
import { porcentajeDe } from '../utils/dinero.js';
import { notificacionService } from './notificacion.service.js';

export const reembolsoService = {
  /**
   * Paso 6 de la Tabla 8 (OE3): al cancelar una reserva se reembolsan sus pagos según el porcentaje
   * de la política (RN-06). Se ejecuta en la misma transacción que la cancelación.
   * Es idempotente: Reembolso.pagoId es único y los cambios de estado son condicionales.
   */
  async procesarCancelacion(reservaId: string, porcentaje: number, motivo: string, tx: Db): Promise<void> {
    for (const pago of await pagoRepository.activosDeReserva(reservaId, tx)) {
      if (pago.estado === 'PENDIENTE') {
        // Pago todavía en verificación: ya no hay nada que confirmar.
        await pagoRepository.actualizarPendiente(
          pago.id,
          { estado: 'RECHAZADO', motivoRechazo: 'La reserva fue cancelada' },
          tx,
        );
        continue;
      }
      if (porcentaje <= 0 || !(await pagoRepository.marcarReembolsado(pago.id, tx))) continue;
      const monto = porcentajeDe(Number(pago.monto), porcentaje);
      await pagoRepository.crearReembolso({ pagoId: pago.id, monto, porcentaje, motivo }, tx);
      await notificacionService.encolar(
        'PAGO_REEMBOLSADO',
        reservaId,
        { montoReembolsado: monto, porcentajeReembolso: porcentaje },
        tx,
      );
    }
  },
};
