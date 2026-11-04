import type { UsuarioToken } from '../models/usuario.model.js';
import { sedeRepository } from '../repositories/sede.repository.js';
import { conflicto, noEncontrado } from '../utils/errores.js';

interface DatosSede {
  nombre: string;
  direccion: string;
  zona: string;
  telefono: string;
  horaApertura: string;
  horaCierre: string;
}

async function existente(id: string) {
  const sede = await sedeRepository.buscarPorId(id);
  if (!sede) throw noEncontrado('Sede');
  return sede;
}

// RF-03: consultar es público; crear, editar y desactivar es del propietario.
export const sedeService = {
  /** Solo el propietario puede ver las sedes desactivadas. */
  listar: (usuario: UsuarioToken | undefined, incluirInactivas: boolean) =>
    sedeRepository.listar(!(incluirInactivas && usuario?.rol === 'PROPIETARIO')),

  async obtener(id: string) {
    const sede = await sedeRepository.buscarConCanchasActivas(id);
    if (!sede) throw noEncontrado('Sede');
    return sede;
  },

  async crear(datos: DatosSede) {
    if (await sedeRepository.buscarPorNombre(datos.nombre)) throw conflicto('Ya existe una sede con ese nombre');
    return sedeRepository.crear(datos);
  },

  async actualizar(id: string, cambios: Partial<DatosSede> & { activa?: boolean }) {
    const sede = await existente(id);
    const apertura = cambios.horaApertura ?? sede.horaApertura;
    const cierre = cambios.horaCierre ?? sede.horaCierre;
    if (apertura >= cierre) throw conflicto('La apertura debe ser antes del cierre');
    if (cambios.nombre && cambios.nombre !== sede.nombre && (await sedeRepository.buscarPorNombre(cambios.nombre))) {
      throw conflicto('Ya existe una sede con ese nombre');
    }
    return sedeRepository.actualizar(id, cambios);
  },

  /** Desactivar en lugar de borrar: las reservas históricas siguen apuntando a la sede. */
  async desactivar(id: string) {
    await existente(id);
    return sedeRepository.actualizar(id, { activa: false });
  },
};
