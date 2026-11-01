import { Router } from 'express';
import { reservaController } from '../controllers/reserva.controller.js';
import { autenticar } from '../middlewares/autenticacion.js';
import { gestores, soloCliente } from '../middlewares/autorizacion.js';

// RF-08 a RF-13. Todas exigen sesión; el acceso a cada reserva se valida en el servicio.
export const reservaRoutes = Router();
reservaRoutes.use(autenticar);

reservaRoutes.post('/', soloCliente, reservaController.crear);
reservaRoutes.get('/mias', reservaController.misReservas);
reservaRoutes.get('/calendario', gestores, reservaController.calendario);
reservaRoutes.get('/:id', reservaController.obtener);
reservaRoutes.get('/:id/cancelacion', reservaController.vistaPreviaCancelacion);
reservaRoutes.post('/:id/cancelar', reservaController.cancelar);
reservaRoutes.post('/:id/confirmar', gestores, reservaController.confirmar);
reservaRoutes.post('/:id/no-show', gestores, reservaController.noSePresento);
