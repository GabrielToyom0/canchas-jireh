import { env } from '../config/env.js';
import { reservaRepository } from '../repositories/reserva.repository.js';
import { notificacionService } from '../services/notificacion.service.js';
import { reservaService } from '../services/reserva.service.js';
import { HORA_MS } from '../utils/fechas.js';
import { logger } from '../utils/logger.js';

/**
 * Tareas periódicas del ciclo de vida (RN-03, RN-04, RF-15) y envío de correos.
 * Cada cambio usa una transición condicional, así que dos ejecuciones no se pisan.
 */
async function ejecutarTareas(ahora = new Date()): Promise<void> {
  // RN-04: liberar reservas pendientes sin pago dentro del plazo.
  for (const { id } of await reservaRepository.pendientesVencidas(ahora)) {
    if (await reservaService.expirar(id, ahora)) logger.info({ reservaId: id }, 'Reserva expirada');
  }

  // RN-03: las confirmadas que ya terminaron pasan a COMPLETADA.
  const completadas = await reservaRepository.completarTerminadas(ahora);
  if (completadas) logger.info(`${completadas} reserva(s) completada(s)`);

  // RF-15: recordatorio antes del inicio.
  const limite = new Date(ahora.getTime() + env.RECORDATORIO_HORAS * HORA_MS);
  for (const { id } of await reservaRepository.porRecordar(ahora, limite)) await reservaService.recordar(id);

  // HU-05: enviar los correos en cola (y reintentar los fallidos).
  const enviados = await notificacionService.enviarPendientes();
  if (enviados) logger.info(`${enviados} correo(s) enviado(s)`);
}

export function iniciarProgramador(): () => void {
  let ocupado = false;
  const ciclo = async () => {
    if (ocupado) return;
    ocupado = true;
    try {
      await ejecutarTareas();
    } catch (err) {
      logger.error({ err }, 'Error en tareas programadas');
    } finally {
      ocupado = false;
    }
  };
  void ciclo();
  const temporizador = setInterval(ciclo, env.TAREAS_INTERVALO_MS);
  return () => clearInterval(temporizador);
}
