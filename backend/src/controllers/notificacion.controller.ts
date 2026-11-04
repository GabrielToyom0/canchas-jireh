import type { Request, Response } from 'express';
import { usuarioDe } from '../middlewares/autenticacion.js';
import { notificacionService } from '../services/notificacion.service.js';

export const notificacionController = {
  async misNotificaciones(req: Request, res: Response) {
    res.json(await notificacionService.misNotificaciones(usuarioDe(req).id));
  },
};
