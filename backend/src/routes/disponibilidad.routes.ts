import { Router } from 'express';
import { disponibilidadController } from '../controllers/disponibilidad.controller.js';

// HU-02 / RF-07: pública (pantalla principal, RF-16).
export const disponibilidadRoutes = Router();

disponibilidadRoutes.get('/', disponibilidadController.consultar);
