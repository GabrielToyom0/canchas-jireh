import { Router } from 'express';
import { canchaController } from '../controllers/cancha.controller.js';
import { tarifaController } from '../controllers/tarifa.controller.js';
import { autenticacionOpcional, autenticar } from '../middlewares/autenticacion.js';
import { gestores, soloPropietario } from '../middlewares/autorizacion.js';

// RF-04: consultar es público; gestionar es de administradores (su sede) y del propietario.
export const canchaRoutes = Router();

canchaRoutes.get('/', autenticacionOpcional, canchaController.listar);
canchaRoutes.get('/:id', canchaController.obtener);
canchaRoutes.post('/', autenticar, gestores, canchaController.crear);
canchaRoutes.patch('/:id', autenticar, gestores, canchaController.actualizar);
canchaRoutes.delete('/:id', autenticar, gestores, canchaController.desactivar);

// RF-05: tarifas de una cancha. Consultarlas es público; crearlas, del propietario.
canchaRoutes.get('/:id/tarifas', tarifaController.listarDeCancha);
canchaRoutes.post('/:id/tarifas', autenticar, soloPropietario, tarifaController.crear);
