import type { Request, Response } from 'express';
import { env } from '../config/env.js';
import { usuarioDe } from '../middlewares/autenticacion.js';
import { authService, type Sesion } from '../services/auth.service.js';
import { leerCookie } from '../utils/cookies.js';
import { noAutenticado } from '../utils/errores.js';
import { esquemaLogin, esquemaRegistro } from '../validators/auth.validator.js';

const COOKIE_REFRESH = 'jireh_rt';

// El refresh token viaja en una cookie httpOnly: el JavaScript del navegador no puede leerlo (OWASP).
const opcionesCookie = () => ({
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: 'strict' as const,
  path: '/api/auth',
});

function responderSesion(res: Response, sesion: Sesion, status = 200) {
  res.cookie(COOKIE_REFRESH, sesion.refreshToken, { ...opcionesCookie(), expires: sesion.refreshExpiraEn });
  res.status(status).json({ accessToken: sesion.accessToken, usuario: sesion.usuario });
}

export const authController = {
  async registrar(req: Request, res: Response) {
    const datos = esquemaRegistro.parse(req.body);
    responderSesion(res, await authService.registrar(datos), 201);
  },

  async iniciarSesion(req: Request, res: Response) {
    const { correo, password } = esquemaLogin.parse(req.body);
    responderSesion(res, await authService.iniciarSesion(correo, password));
  },

  async renovar(req: Request, res: Response) {
    const token = leerCookie(req.headers.cookie, COOKIE_REFRESH);
    if (!token) throw noAutenticado('No hay una sesión activa');
    try {
      responderSesion(res, await authService.renovar(token));
    } catch (err) {
      res.clearCookie(COOKIE_REFRESH, opcionesCookie());
      throw err;
    }
  },

  async cerrarSesion(req: Request, res: Response) {
    const token = leerCookie(req.headers.cookie, COOKIE_REFRESH);
    if (token) await authService.cerrarSesion(token);
    res.clearCookie(COOKIE_REFRESH, opcionesCookie());
    res.status(204).end();
  },

  async perfil(req: Request, res: Response) {
    res.json(await authService.perfil(usuarioDe(req).id));
  },
};
