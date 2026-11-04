import type { Request, Response } from 'express';
import { politicaService } from '../services/politica.service.js';
import { esquemaReglasPolitica, esquemaSedePolitica } from '../validators/politica.validator.js';

export const politicaController = {
  async obtener(req: Request, res: Response) {
    const { sedeId } = esquemaSedePolitica.parse(req.params);
    res.json({ sedeId, reglas: await politicaService.reglasDeSede(sedeId) });
  },

  async guardar(req: Request, res: Response) {
    const { sedeId } = esquemaSedePolitica.parse(req.params);
    const { reglas } = esquemaReglasPolitica.parse(req.body);
    res.json({ sedeId, reglas: await politicaService.guardar(sedeId, reglas) });
  },
};
