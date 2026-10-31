import type { Request, Response } from 'express';
import { disponibilidadService } from '../services/disponibilidad.service.js';
import { esquemaDisponibilidad } from '../validators/disponibilidad.validator.js';

export const disponibilidadController = {
  async consultar(req: Request, res: Response) {
    const { sedeId, fecha, deporte } = esquemaDisponibilidad.parse(req.query);
    res.json(await disponibilidadService.consultar(sedeId, fecha, deporte));
  },
};
