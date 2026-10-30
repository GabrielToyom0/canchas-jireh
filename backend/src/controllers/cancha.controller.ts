import type { Request, Response } from 'express';
import { usuarioDe } from '../middlewares/autenticacion.js';
import { canchaService } from '../services/cancha.service.js';
import { esquemaCancha, esquemaCanchaParcial, esquemaFiltroCanchas } from '../validators/cancha.validator.js';
import { esquemaId } from '../validators/comun.validator.js';

export const canchaController = {
  async listar(req: Request, res: Response) {
    const filtros = esquemaFiltroCanchas.parse(req.query);
    res.json(await canchaService.listar(req.usuario, filtros));
  },

  async obtener(req: Request, res: Response) {
    const { id } = esquemaId.parse(req.params);
    res.json(await canchaService.obtener(id));
  },

  async crear(req: Request, res: Response) {
    const datos = esquemaCancha.parse(req.body);
    res.status(201).json(await canchaService.crear(usuarioDe(req), datos));
  },

  async actualizar(req: Request, res: Response) {
    const { id } = esquemaId.parse(req.params);
    const cambios = esquemaCanchaParcial.parse(req.body);
    res.json(await canchaService.actualizar(usuarioDe(req), id, cambios));
  },

  async desactivar(req: Request, res: Response) {
    const { id } = esquemaId.parse(req.params);
    res.json(await canchaService.desactivar(usuarioDe(req), id));
  },
};
