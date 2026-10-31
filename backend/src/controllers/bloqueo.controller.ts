import type { Request, Response } from 'express';
import { usuarioDe } from '../middlewares/autenticacion.js';
import { bloqueoService } from '../services/bloqueo.service.js';
import { esquemaBloqueo, esquemaFiltroBloqueos } from '../validators/bloqueo.validator.js';
import { esquemaId } from '../validators/comun.validator.js';

export const bloqueoController = {
  async listar(req: Request, res: Response) {
    const filtros = esquemaFiltroBloqueos.parse(req.query);
    res.json(await bloqueoService.listar(usuarioDe(req), filtros));
  },

  async crear(req: Request, res: Response) {
    const datos = esquemaBloqueo.parse(req.body);
    res.status(201).json(await bloqueoService.crear(usuarioDe(req), datos));
  },

  async eliminar(req: Request, res: Response) {
    const { id } = esquemaId.parse(req.params);
    await bloqueoService.eliminar(usuarioDe(req), id);
    res.status(204).end();
  },
};
