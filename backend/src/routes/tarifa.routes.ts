import { Router } from 'express';
import { tarifaController } from '../controllers/tarifa.controller.js';
import { autenticar } from '../middlewares/autenticacion.js';
import { soloPropietario } from '../middlewares/autorizacion.js';

// RF-05: editar y eliminar tarifas (crearlas está en /canchas/:id/tarifas).
export const tarifaRoutes = Router();
tarifaRoutes.use(autenticar, soloPropietario);

tarifaRoutes.patch('/:id', tarifaController.actualizar);
tarifaRoutes.delete('/:id', tarifaController.eliminar);
