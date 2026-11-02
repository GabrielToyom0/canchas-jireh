import type { Request, Response } from 'express';
import { usuarioDe } from '../middlewares/autenticacion.js';
import { reporteService } from '../services/reporte.service.js';
import { esquemaReporte } from '../validators/reporte.validator.js';

export const reporteController = {
  async ocupacion(req: Request, res: Response) {
    res.json(await reporteService.ocupacion(usuarioDe(req), esquemaReporte.parse(req.query)));
  },

  async ingresos(req: Request, res: Response) {
    res.json(await reporteService.ingresos(usuarioDe(req), esquemaReporte.parse(req.query)));
  },
};
