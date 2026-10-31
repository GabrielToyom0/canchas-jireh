import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { autenticar } from '../middlewares/autenticacion.js';
import { limiteAutenticacion } from '../middlewares/limiteSolicitudes.js';

// HU-01 / RF-01 / RF-02. Públicas, con límite estricto en registro e inicio de sesión.
export const authRoutes = Router();

authRoutes.post('/registro', limiteAutenticacion, authController.registrar);
authRoutes.post('/login', limiteAutenticacion, authController.iniciarSesion);
authRoutes.post('/refresh', authController.renovar);
authRoutes.post('/logout', authController.cerrarSesion);
authRoutes.get('/me', autenticar, authController.perfil);
