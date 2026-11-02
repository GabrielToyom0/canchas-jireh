import { Router } from 'express';
import { reporteController } from '../controllers/reporte.controller.js';
import { autenticar } from '../middlewares/autenticacion.js';
import { gestores } from '../middlewares/autorizacion.js';

// OE5 / HU-12
export const reporteRoutes = Router();
reporteRoutes.use(autenticar, gestores);

reporteRoutes.get('/ocupacion', reporteController.ocupacion);
reporteRoutes.get('/ingresos', reporteController.ingresos);
