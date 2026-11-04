import type { Request, Response } from 'express';
import { tarifaService } from '../services/tarifa.service.js';
import { esquemaId } from '../validators/comun.validator.js';
import { esquemaTarifa, esquemaTarifaParcial } from '../validators/tarifa.validator.js';

export const tarifaController = {
  /** GET /canchas/:id/tarifas */
  async listarDeCancha(req: Request, res: Response) {
    const { id } = esquemaId.parse(req.params);
    res.json(await tarifaService.listar(id));
  },

  /** POST /canchas/:id/tarifas */
  async crear(req: Request, res: Response) {
    const { id } = esquemaId.parse(req.params);
    const datos = esquemaTarifa.parse(req.body);
    res.status(201).json(await tarifaService.crear(id, datos));
  },

  async actualizar(req: Request, res: Response) {
    const { id } = esquemaId.parse(req.params);
    res.json(await tarifaService.actualizar(id, esquemaTarifaParcial.parse(req.body)));
  },

  async eliminar(req: Request, res: Response) {
    const { id } = esquemaId.parse(req.params);
    await tarifaService.eliminar(id);
    res.status(204).end();
  },
};
