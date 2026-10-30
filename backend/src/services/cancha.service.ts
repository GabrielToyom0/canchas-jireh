import type { Deporte } from '../models/enums.js';
import type { UsuarioToken } from '../models/usuario.model.js';
import { canchaRepository } from '../repositories/cancha.repository.js';
import { sedeRepository } from '../repositories/sede.repository.js';
import { conflicto, noEncontrado } from '../utils/errores.js';
import { exigirGestionSede } from '../utils/permisos.js';

interface DatosCancha {
  nombre: string;
  deporte: Deporte;
  superficie: string;
  capacidad: number;
}

// RF-04: canchas por sede. El administrador gestiona solo las de su sede (RN-07).
export const canchaService = {
  async existente(id: string) {
    const cancha = await canchaRepository.buscarPorId(id);
    if (!cancha) throw noEncontrado('Cancha');
    return cancha;
  },

  /** Las canchas inactivas solo las ven los gestores. */
  listar: (
    usuario: UsuarioToken | undefined,
    filtros: { sedeId?: string; deporte?: Deporte; incluirInactivas: boolean },
  ) =>
    canchaRepository.listar({
      ...filtros,
      incluirInactivas: filtros.incluirInactivas && !!usuario && usuario.rol !== 'CLIENTE',
    }),

  async obtener(id: string) {
    const cancha = await canchaRepository.buscarConSede(id);
    if (!cancha) throw noEncontrado('Cancha');
    return cancha;
  },

  async crear(usuario: UsuarioToken, datos: DatosCancha & { sedeId: string }) {
    exigirGestionSede(usuario, datos.sedeId);
    if (!(await sedeRepository.buscarPorId(datos.sedeId))) throw noEncontrado('Sede');
    if (await canchaRepository.buscarPorNombre(datos.sedeId, datos.nombre)) {
      throw conflicto('Ya existe una cancha con ese nombre en la sede');
    }
    return canchaRepository.crear(datos);
  },

  async actualizar(usuario: UsuarioToken, id: string, cambios: Partial<DatosCancha> & { activa?: boolean }) {
    const cancha = await canchaService.existente(id);
    exigirGestionSede(usuario, cancha.sedeId);
    if (cambios.nombre && cambios.nombre !== cancha.nombre) {
      if (await canchaRepository.buscarPorNombre(cancha.sedeId, cambios.nombre)) {
        throw conflicto('Ya existe una cancha con ese nombre en la sede');
      }
    }
    return canchaRepository.actualizar(id, cambios);
  },

  async desactivar(usuario: UsuarioToken, id: string) {
    const cancha = await canchaService.existente(id);
    exigirGestionSede(usuario, cancha.sedeId);
    return canchaRepository.actualizar(id, { activa: false });
  },
};
