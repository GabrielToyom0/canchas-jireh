import { Router } from 'express';
import { usuarioController } from '../controllers/usuario.controller.js';
import { autenticar } from '../middlewares/autenticacion.js';
import { soloPropietario } from '../middlewares/autorizacion.js';

// Gestión de administradores de sede: solo el propietario.
export const usuarioRoutes = Router();
usuarioRoutes.use(autenticar, soloPropietario);

usuarioRoutes.get('/', usuarioController.listar);
usuarioRoutes.post('/administradores', usuarioController.crearAdministrador);
usuarioRoutes.patch('/:id', usuarioController.actualizar);
