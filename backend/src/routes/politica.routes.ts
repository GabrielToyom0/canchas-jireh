import { Router } from 'express';
import { politicaController } from '../controllers/politica.controller.js';
import { autenticar } from '../middlewares/autenticacion.js';
import { soloPropietario } from '../middlewares/autorizacion.js';

// RN-06: consultar la política es público; cambiarla, del propietario.
export const politicaRoutes = Router();

politicaRoutes.get('/:sedeId', politicaController.obtener);
politicaRoutes.put('/:sedeId', autenticar, soloPropietario, politicaController.guardar);
