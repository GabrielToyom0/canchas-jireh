import { politicaRepository } from '../repositories/politica.repository.js';
import { sedeRepository } from '../repositories/sede.repository.js';
import { noEncontrado } from '../utils/errores.js';
import { POLITICA_POR_DEFECTO, type ReglaReembolso } from './reglas/reembolso.js';

// RN-06: política de cancelación configurable por sede. Consultarla es público.
export const politicaService = {
  /** Reglas de la sede, o la política por defecto si la sede no configuró ninguna. */
  async reglasDeSede(sedeId: string): Promise<ReglaReembolso[]> {
    const reglas = await politicaRepository.deSede(sedeId);
    if (!reglas.length) return POLITICA_POR_DEFECTO;
    return reglas.map(({ horasAntes, porcentajeReembolso }) => ({ horasAntes, porcentajeReembolso }));
  },

  async guardar(sedeId: string, reglas: ReglaReembolso[]): Promise<ReglaReembolso[]> {
    if (!(await sedeRepository.buscarPorId(sedeId))) throw noEncontrado('Sede');
    await politicaRepository.reemplazar(sedeId, reglas);
    return [...reglas].sort((a, b) => b.horasAntes - a.horasAntes);
  },
};
