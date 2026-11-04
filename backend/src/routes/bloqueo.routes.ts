import { Router } from 'express';
import { bloqueoController } from '../controllers/bloqueo.controller.js';
import { autenticar } from '../middlewares/autenticacion.js';
import { gestores } from '../middlewares/autorizacion.js';

// RF-06 / HU-11
export const bloqueoRoutes = Router();
bloqueoRoutes.use(autenticar, gestores);

bloqueoRoutes.get('/', bloqueoController.listar);
bloqueoRoutes.post('/', bloqueoController.crear);
bloqueoRoutes.delete('/:id', bloqueoController.eliminar);
