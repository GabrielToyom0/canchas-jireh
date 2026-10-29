import type { Rol } from '../models/enums.js';
import { usuarioPublico, type UsuarioPublico, type UsuarioToken } from '../models/usuario.model.js';
import { refreshTokenRepository } from '../repositories/refreshToken.repository.js';
import { sedeRepository } from '../repositories/sede.repository.js';
import { usuarioRepository } from '../repositories/usuario.repository.js';
import { conflicto, noEncontrado, solicitudInvalida } from '../utils/errores.js';
import { hashPassword } from '../utils/hash.js';

async function exigirSede(sedeId: string) {
  if (!(await sedeRepository.buscarPorId(sedeId))) throw noEncontrado('Sede');
}

// Gestión de administradores de sede: solo el propietario (Tabla 2).
export const usuarioService = {
  listar: async (rol?: Rol): Promise<UsuarioPublico[]> => (await usuarioRepository.listar(rol)).map(usuarioPublico),

  async crearAdministrador(datos: {
    nombre: string;
    correo: string;
    telefono: string;
    password: string;
    sedeId: string;
  }): Promise<UsuarioPublico> {
    if (await usuarioRepository.buscarPorCorreo(datos.correo)) {
      throw conflicto('Ya existe una cuenta con ese correo', 'CORREO_REGISTRADO');
    }
    await exigirSede(datos.sedeId);
    const admin = await usuarioRepository.crear({
      nombre: datos.nombre,
      correo: datos.correo,
      telefono: datos.telefono,
      passwordHash: await hashPassword(datos.password),
      rol: 'ADMIN_SEDE',
      sedeId: datos.sedeId,
    });
    return usuarioPublico(admin);
  },

  async actualizar(
    actor: UsuarioToken,
    id: string,
    cambios: { activo?: boolean; sedeId?: string },
  ): Promise<UsuarioPublico> {
    const usuario = await usuarioRepository.buscarPorId(id);
    if (!usuario) throw noEncontrado('Usuario');
    if (usuario.id === actor.id) throw solicitudInvalida('No puede modificar su propia cuenta');
    if (cambios.sedeId) {
      if (usuario.rol !== 'ADMIN_SEDE') throw solicitudInvalida('Solo los administradores tienen sede');
      await exigirSede(cambios.sedeId);
    }
    const actualizado = await usuarioRepository.actualizar(id, cambios);
    // Al desactivar una cuenta se cierran sus sesiones.
    if (cambios.activo === false) await refreshTokenRepository.revocarTodos(id);
    return usuarioPublico(actualizado);
  },
};
