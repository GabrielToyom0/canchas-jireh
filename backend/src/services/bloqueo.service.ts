import type { UsuarioToken } from '../models/usuario.model.js';
import { bloqueoRepository } from '../repositories/bloqueo.repository.js';
import { canchaRepository } from '../repositories/cancha.repository.js';
import { reservaRepository } from '../repositories/reserva.repository.js';
import { conflicto, noEncontrado, reglaNegocio } from '../utils/errores.js';
import { aUtc, rangoDelDia } from '../utils/fechas.js';
import { exigirGestionSede, sedeDeConsulta } from '../utils/permisos.js';

interface NuevoBloqueo {
  canchaId: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  motivo: string;
}

// RF-06 / HU-11: bloqueos de horario por mantenimiento u otro motivo.
export const bloqueoService = {
  listar: (usuario: UsuarioToken, filtros: { sedeId?: string; desde: string; hasta: string }) =>
    bloqueoRepository.listar({
      sedeId: sedeDeConsulta(usuario, filtros.sedeId),
      desde: rangoDelDia(filtros.desde).desde,
      hasta: rangoDelDia(filtros.hasta).hasta,
    }),

  async crear(usuario: UsuarioToken, datos: NuevoBloqueo) {
    const cancha = await canchaRepository.buscarConSede(datos.canchaId);
    if (!cancha) throw noEncontrado('Cancha');
    exigirGestionSede(usuario, cancha.sedeId);
    if (datos.horaInicio < cancha.sede.horaApertura || datos.horaFin > cancha.sede.horaCierre) {
      throw reglaNegocio('El bloqueo debe estar dentro del horario de la sede');
    }
    const inicio = aUtc(datos.fecha, datos.horaInicio);
    const fin = aUtc(datos.fecha, datos.horaFin);
    if (fin <= new Date()) throw reglaNegocio('No se pueden bloquear horarios pasados');

    if (await bloqueoRepository.buscarSolapado(cancha.id, inicio, fin)) {
      throw conflicto('Ya existe un bloqueo en ese horario');
    }
    // No se bloquea encima de reservas activas: el administrador debe cancelarlas primero.
    const reservas = await reservaRepository.contarActivas(cancha.id, inicio, fin);
    if (reservas > 0) {
      throw conflicto(
        `Hay ${reservas} reserva(s) activa(s) en ese horario; cancélelas antes de bloquear`,
        'HAY_RESERVAS',
      );
    }
    return bloqueoRepository.crear({ canchaId: cancha.id, inicio, fin, motivo: datos.motivo, creadoPor: usuario.id });
  },

  async eliminar(usuario: UsuarioToken, id: string) {
    const bloqueo = await bloqueoRepository.buscarConCancha(id);
    if (!bloqueo) throw noEncontrado('Bloqueo');
    exigirGestionSede(usuario, bloqueo.cancha.sedeId);
    await bloqueoRepository.eliminar(id);
  },
};
