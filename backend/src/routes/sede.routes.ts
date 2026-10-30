import { Router } from 'express';
import { sedeController } from '../controllers/sede.controller.js';
import { autenticacionOpcional, autenticar } from '../middlewares/autenticacion.js';
import { soloPropietario } from '../middlewares/autorizacion.js';

// RF-03: consultar es público; crear, editar y desactivar es del propietario.
export const sedeRoutes = Router();

sedeRoutes.get('/', autenticacionOpcional, sedeController.listar);
sedeRoutes.get('/:id', sedeController.obtener);
sedeRoutes.post('/', autenticar, soloPropietario, sedeController.crear);
sedeRoutes.patch('/:id', autenticar, soloPropietario, sedeController.actualizar);
sedeRoutes.delete('/:id', autenticar, soloPropietario, sedeController.desactivar);
