import { env } from '../config/env.js';
import { usuarioPublico, usuarioToken, type Usuario, type UsuarioPublico } from '../models/usuario.model.js';
import { refreshTokenRepository } from '../repositories/refreshToken.repository.js';
import { usuarioRepository } from '../repositories/usuario.repository.js';
import { conflicto, noAutenticado, noEncontrado, prohibido } from '../utils/errores.js';
import {
  compararConHashFicticio,
  compararPassword,
  generarRefreshToken,
  hashPassword,
  hashToken,
} from '../utils/hash.js';
import { firmarAccessToken } from '../utils/jwt.js';
import { logger } from '../utils/logger.js';

export interface Sesion {
  accessToken: string;
  refreshToken: string;
  refreshExpiraEn: Date;
  usuario: UsuarioPublico;
}

/**
 * Margen de reutilización: si un token recién rotado vuelve a llegar dentro de este margen
 * (dos pestañas a la vez, o una recarga que canceló la respuesta anterior) se trata como
 * concurrencia legítima y no como robo.
 */
const MARGEN_REUTILIZACION_MS = 20_000;

/** Emite un access token (vida corta) y un refresh token (RNF-01). */
async function emitirSesion(usuario: Usuario): Promise<Sesion> {
  if (!usuario.activo) throw prohibido('La cuenta está desactivada');
  const refreshToken = generarRefreshToken();
  const refreshExpiraEn = new Date(Date.now() + env.REFRESH_TTL_DIAS * 86_400_000);
  await refreshTokenRepository.crear({
    usuarioId: usuario.id,
    tokenHash: hashToken(refreshToken),
    expiraEn: refreshExpiraEn,
  });
  return {
    accessToken: firmarAccessToken(usuarioToken(usuario)),
    refreshToken,
    refreshExpiraEn,
    usuario: usuarioPublico(usuario),
  };
}

export const authService = {
  /** HU-01 / RF-01: registro de clientes. */
  async registrar(datos: { nombre: string; correo: string; telefono: string; password: string }): Promise<Sesion> {
    if (await usuarioRepository.buscarPorCorreo(datos.correo)) {
      throw conflicto('Ya existe una cuenta con ese correo', 'CORREO_REGISTRADO');
    }
    const usuario = await usuarioRepository.crear({
      nombre: datos.nombre,
      correo: datos.correo,
      telefono: datos.telefono,
      passwordHash: await hashPassword(datos.password),
      rol: 'CLIENTE',
    });
    return emitirSesion(usuario);
  },

  async iniciarSesion(correo: string, password: string): Promise<Sesion> {
    const usuario = await usuarioRepository.buscarPorCorreo(correo);
    const valido = usuario
      ? await compararPassword(password, usuario.passwordHash)
      : await compararConHashFicticio(password);
    // Mismo mensaje para correo inexistente y contraseña incorrecta.
    if (!usuario || !valido) throw noAutenticado('Correo o contraseña incorrectos');
    return emitirSesion(usuario);
  },

  /**
   * Rotación: cada refresh token sirve una sola vez. Si llega un token revocado
   * fuera del margen se asume robo y se cierran todas las sesiones del usuario.
   */
  async renovar(refreshToken: string): Promise<Sesion> {
    const registro = await refreshTokenRepository.buscarPorHash(hashToken(refreshToken));
    if (!registro) throw noAutenticado('Sesión no válida');
    if (registro.expiraEn < new Date()) throw noAutenticado('La sesión expiró');

    const ahora = Date.now();
    const dentroDelMargen =
      !!registro.reemplazadoEn && ahora - registro.reemplazadoEn.getTime() < MARGEN_REUTILIZACION_MS;
    if (registro.revocado && !dentroDelMargen) {
      await refreshTokenRepository.revocarTodos(registro.usuarioId);
      throw noAutenticado('Sesión no válida');
    }
    if (!registro.revocado) await refreshTokenRepository.marcarRotado(registro.id, new Date(ahora));
    return emitirSesion(registro.usuario);
  },

  async cerrarSesion(refreshToken: string): Promise<void> {
    await refreshTokenRepository.revocarPorHash(hashToken(refreshToken));
  },

  async perfil(usuarioId: string): Promise<UsuarioPublico> {
    const usuario = await usuarioRepository.buscarPorId(usuarioId);
    if (!usuario) throw noEncontrado('Usuario');
    return usuarioPublico(usuario);
  },

  /** Crea la cuenta del propietario la primera vez que arranca el sistema. */
  async asegurarPropietario(): Promise<void> {
    if (!env.PROPIETARIO_CORREO || !env.PROPIETARIO_PASSWORD) return;
    if (await usuarioRepository.existePropietario()) return;
    await usuarioRepository.crear({
      nombre: env.PROPIETARIO_NOMBRE,
      correo: env.PROPIETARIO_CORREO.toLowerCase(),
      telefono: '00000000',
      passwordHash: await hashPassword(env.PROPIETARIO_PASSWORD),
      rol: 'PROPIETARIO',
    });
    logger.info(`Cuenta de propietario creada: ${env.PROPIETARIO_CORREO}`);
  },
};
