import type { TipoDia } from '../models/enums.js';
import { tarifaJson } from '../models/tarifa.model.js';
import { tarifaRepository } from '../repositories/tarifa.repository.js';
import { noEncontrado } from '../utils/errores.js';
import { fechaDb } from '../utils/fechas.js';
import { canchaService } from './cancha.service.js';

interface DatosTarifa {
  tipoDia: TipoDia;
  horaInicio: string;
  horaFin: string;
  precioHora: number;
  vigenteDesde: string;
  vigenteHasta?: string | null;
}

async function existente(id: string) {
  const tarifa = await tarifaRepository.buscarPorId(id);
  if (!tarifa) throw noEncontrado('Tarifa');
  return tarifa;
}

// RF-05: tarifas por cancha, franja horaria y tipo de día. Consultarlas es público; gestionarlas, del propietario.
export const tarifaService = {
  async listar(canchaId: string) {
    await canchaService.existente(canchaId);
    return (await tarifaRepository.listarDeCancha(canchaId)).map(tarifaJson);
  },

  async crear(canchaId: string, datos: DatosTarifa) {
    await canchaService.existente(canchaId);
    const tarifa = await tarifaRepository.crear({
      canchaId,
      tipoDia: datos.tipoDia,
      horaInicio: datos.horaInicio,
      horaFin: datos.horaFin,
      precioHora: datos.precioHora,
      vigenteDesde: fechaDb(datos.vigenteDesde),
      vigenteHasta: datos.vigenteHasta ? fechaDb(datos.vigenteHasta) : null,
    });
    return tarifaJson(tarifa);
  },

  async actualizar(id: string, cambios: Partial<DatosTarifa>) {
    await existente(id);
    const { vigenteDesde, vigenteHasta, ...resto } = cambios;
    const tarifa = await tarifaRepository.actualizar(id, {
      ...resto,
      vigenteDesde: vigenteDesde ? fechaDb(vigenteDesde) : undefined,
      vigenteHasta: vigenteHasta === undefined ? undefined : vigenteHasta ? fechaDb(vigenteHasta) : null,
    });
    return tarifaJson(tarifa);
  },

  /** RN-05: el precio queda fijo en cada reserva, así que borrar una tarifa no altera reservas existentes. */
  async eliminar(id: string) {
    await existente(id);
    await tarifaRepository.eliminar(id);
  },
};
