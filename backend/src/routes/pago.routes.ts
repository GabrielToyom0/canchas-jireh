import { Router } from 'express';
import { pagoController } from '../controllers/pago.controller.js';
import { autenticar } from '../middlewares/autenticacion.js';
import { gestores, soloCliente } from '../middlewares/autorizacion.js';
import { recibirComprobante } from '../middlewares/subidaComprobante.js';

// RF-14 / RN-08 / HU-04 / HU-10
export const pagoRoutes = Router();
pagoRoutes.use(autenticar);

pagoRoutes.post('/tarjeta', soloCliente, pagoController.tarjeta);
pagoRoutes.post('/transferencia', soloCliente, recibirComprobante, pagoController.transferencia);
pagoRoutes.post('/efectivo', soloCliente, pagoController.efectivo);
pagoRoutes.get('/mios', pagoController.misPagos);
pagoRoutes.get('/pendientes', gestores, pagoController.pendientes);
pagoRoutes.get('/', pagoController.deReserva);
pagoRoutes.post('/:id/verificar', gestores, pagoController.verificar);
pagoRoutes.get('/:id/comprobante', pagoController.comprobante);
