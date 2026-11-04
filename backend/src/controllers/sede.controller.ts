import type { Request, Response } from 'express';
import { sedeService } from '../services/sede.service.js';
import { esquemaId } from '../validators/comun.validator.js';
import { esquemaFiltroSedes, esquemaSede, esquemaSedeParcial } from '../validators/sede.validator.js';

export const sedeController = {
  async listar(req: Request, res: Response) {
    const { incluirInactivas } = esquemaFiltroSedes.parse(req.query);
    res.json(await sedeService.listar(req.usuario, incluirInactivas));
  },

  async obtener(req: Request, res: Response) {
    const { id } = esquemaId.parse(req.params);
    res.json(await sedeService.obtener(id));
  },

  async crear(req: Request, res: Response) {
    res.status(201).json(await sedeService.crear(esquemaSede.parse(req.body)));
  },

  async actualizar(req: Request, res: Response) {
    const { id } = esquemaId.parse(req.params);
    res.json(await sedeService.actualizar(id, esquemaSedeParcial.parse(req.body)));
  },

  async desactivar(req: Request, res: Response) {
    const { id } = esquemaId.parse(req.params);
    res.json(await sedeService.desactivar(id));
  },
};
