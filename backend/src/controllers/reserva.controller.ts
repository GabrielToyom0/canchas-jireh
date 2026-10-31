import type { Request, Response } from 'express';
import { usuarioDe } from '../middlewares/autenticacion.js';
import { reservaJson } from '../models/reserva.model.js';
import { reservaService } from '../services/reserva.service.js';
import { esquemaId } from '../validators/comun.validator.js';
import {
  esquemaCalendario,
  esquemaCancelacion,
  esquemaFiltroMisReservas,
  esquemaNuevaReserva,
} from '../validators/reserva.validator.js';

export const reservaController = {
  async crear(req: Request, res: Response) {
    const datos = esquemaNuevaReserva.parse(req.body);
    res.status(201).json(reservaJson(await reservaService.crear(usuarioDe(req), datos)));
  },

  async misReservas(req: Request, res: Response) {
    const { estado } = esquemaFiltroMisReservas.parse(req.query);
    res.json((await reservaService.misReservas(usuarioDe(req), estado)).map(reservaJson));
  },

  async calendario(req: Request, res: Response) {
    const { sedeId, fecha } = esquemaCalendario.parse(req.query);
    res.json((await reservaService.calendario(usuarioDe(req), sedeId, fecha)).map(reservaJson));
  },

  async obtener(req: Request, res: Response) {
    const { id } = esquemaId.parse(req.params);
    res.json(reservaJson(await reservaService.obtenerConAcceso(usuarioDe(req), id)));
  },

  async vistaPreviaCancelacion(req: Request, res: Response) {
    const { id } = esquemaId.parse(req.params);
    const usuario = usuarioDe(req);
    const reserva = await reservaService.obtenerConAcceso(usuario, id);
    res.json(await reservaService.vistaPreviaCancelacion(usuario, reserva));
  },

  async cancelar(req: Request, res: Response) {
    const { id } = esquemaId.parse(req.params);
    const { motivo } = esquemaCancelacion.parse(req.body ?? {});
    const usuario = usuarioDe(req);
    const reserva = await reservaService.obtenerConAcceso(usuario, id);
    res.json(reservaJson(await reservaService.cancelar(usuario, reserva, motivo)));
  },

  async confirmar(req: Request, res: Response) {
    const { id } = esquemaId.parse(req.params);
    const reserva = await reservaService.obtenerConAcceso(usuarioDe(req), id);
    res.json(reservaJson(await reservaService.confirmarManual(reserva)));
  },

  async noSePresento(req: Request, res: Response) {
    const { id } = esquemaId.parse(req.params);
    const reserva = await reservaService.obtenerConAcceso(usuarioDe(req), id);
    res.json(reservaJson(await reservaService.marcarNoSePresento(reserva)));
  },
};
