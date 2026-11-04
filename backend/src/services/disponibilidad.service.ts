import { env } from '../config/env.js';
import type { Deporte } from '../models/enums.js';
import { tarifaJson } from '../models/tarifa.model.js';
import { canchaRepository } from '../repositories/cancha.repository.js';
import { reservaRepository } from '../repositories/reserva.repository.js';
import { sedeRepository } from '../repositories/sede.repository.js';
import { noEncontrado, reglaNegocio } from '../utils/errores.js';
import { hoyLocal, rangoDelDia, sumarDias } from '../utils/fechas.js';
import { horariosDelDia } from './reglas/horario.js';

export const disponibilidadService = {
  /** HU-02 / RF-07: horarios de cada cancha de la sede en el día, con su estado y precio. */
  async consultar(sedeId: string, fecha: string, deporte?: Deporte) {
    if (fecha < hoyLocal()) throw reglaNegocio('La fecha ya pasó');
    if (fecha > sumarDias(hoyLocal(), env.MAX_DIAS_ANTICIPACION)) {
      throw reglaNegocio(`Solo se puede consultar hasta ${env.MAX_DIAS_ANTICIPACION} días adelante`);
    }
    const sede = await sedeRepository.buscarPorId(sedeId);
    if (!sede) throw noEncontrado('Sede');
    if (!sede.activa) throw reglaNegocio('La sede no está disponible');

    const { desde, hasta } = rangoDelDia(fecha);
    const canchas = await canchaRepository.deSedeConDetalle(sedeId, desde, hasta, deporte);
    const ocupadas = await reservaRepository.activasEnCanchas(
      canchas.map((c) => c.id),
      desde,
      hasta,
    );

    return {
      fecha,
      sede: { id: sede.id, nombre: sede.nombre, horaApertura: sede.horaApertura, horaCierre: sede.horaCierre },
      canchas: canchas.map((cancha) => ({
        id: cancha.id,
        nombre: cancha.nombre,
        deporte: cancha.deporte,
        superficie: cancha.superficie,
        capacidad: cancha.capacidad,
        horarios: horariosDelDia(
          sede,
          cancha.tarifas.map(tarifaJson),
          cancha.bloqueos,
          ocupadas.filter((r) => r.canchaId === cancha.id),
          fecha,
        ),
      })),
    };
  },
};
