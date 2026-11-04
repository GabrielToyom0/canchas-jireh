import { Router } from 'express';
import { notificacionController } from '../controllers/notificacion.controller.js';
import { autenticar } from '../middlewares/autenticacion.js';

// El cliente puede consultar los avisos que se le enviaron (RF-15).
export const notificacionRoutes = Router();

notificacionRoutes.get('/mias', autenticar, notificacionController.misNotificaciones);
