import { createReadStream } from 'node:fs';
import type { Request, Response } from 'express';
import { usuarioDe } from '../middlewares/autenticacion.js';
import { borrarArchivo, contenidoCoincide } from '../middlewares/subidaComprobante.js';
import { pagoJson } from '../models/pago.model.js';
import { pagoService } from '../services/pago.service.js';
import { solicitudInvalida } from '../utils/errores.js';
import { esquemaId } from '../validators/comun.validator.js';
import {
  esquemaFiltroPendientes,
  esquemaReservaPago,
  esquemaTarjeta,
  esquemaTransferencia,
  esquemaVerificacion,
} from '../validators/pago.validator.js';

export const pagoController = {
  async tarjeta(req: Request, res: Response) {
    const { reservaId, numero } = esquemaTarjeta.parse(req.body);
    res.status(201).json(pagoJson(await pagoService.pagarConTarjeta(usuarioDe(req), reservaId, numero)));
  },

  /** Llega después de `recibirComprobante` (multer); si algo falla se borra el archivo subido. */
  async transferencia(req: Request, res: Response) {
    const archivo = req.file;
    try {
      if (!archivo) throw solicitudInvalida('Adjunte el comprobante de la transferencia');
      if (!(await contenidoCoincide(archivo.path))) throw solicitudInvalida('El archivo no es una imagen o PDF válido');
      const { reservaId, referenciaBanco } = esquemaTransferencia.parse(req.body);
      const pago = await pagoService.pagarConTransferencia(
        usuarioDe(req),
        reservaId,
        archivo.filename,
        referenciaBanco,
      );
      res.status(201).json(pagoJson(pago));
    } catch (err) {
      if (archivo) await borrarArchivo(archivo.path);
      throw err;
    }
  },

  async efectivo(req: Request, res: Response) {
    const { reservaId } = esquemaReservaPago.parse(req.body);
    res.status(201).json(pagoJson(await pagoService.pagarEnEfectivo(usuarioDe(req), reservaId)));
  },

  async misPagos(req: Request, res: Response) {
    res.json((await pagoService.misPagos(usuarioDe(req))).map(pagoJson));
  },

  async pendientes(req: Request, res: Response) {
    const { sedeId } = esquemaFiltroPendientes.parse(req.query);
    res.json((await pagoService.pendientes(usuarioDe(req), sedeId)).map(pagoJson));
  },

  async deReserva(req: Request, res: Response) {
    const { reservaId } = esquemaReservaPago.parse(req.query);
    res.json((await pagoService.deReserva(usuarioDe(req), reservaId)).map(pagoJson));
  },

  async verificar(req: Request, res: Response) {
    const { id } = esquemaId.parse(req.params);
    const { aprobar, motivo } = esquemaVerificacion.parse(req.body);
    res.json(pagoJson(await pagoService.verificar(usuarioDe(req), id, aprobar, motivo)));
  },

  async comprobante(req: Request, res: Response) {
    const { id } = esquemaId.parse(req.params);
    const { ruta, extension, tipo } = await pagoService.comprobante(usuarioDe(req), id);
    res.setHeader('Content-Type', tipo);
    res.setHeader('Content-Disposition', `inline; filename="comprobante${extension}"`);
    res.setHeader('Cache-Control', 'private, no-store');
    createReadStream(ruta).pipe(res);
  },
};
