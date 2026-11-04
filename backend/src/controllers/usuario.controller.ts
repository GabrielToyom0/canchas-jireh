import type { Request, Response } from 'express';
import { usuarioDe } from '../middlewares/autenticacion.js';
import { usuarioService } from '../services/usuario.service.js';
import { esquemaId } from '../validators/comun.validator.js';
import {
  esquemaActualizacionUsuario,
  esquemaFiltroUsuarios,
  esquemaNuevoAdmin,
} from '../validators/usuario.validator.js';

export const usuarioController = {
  async listar(req: Request, res: Response) {
    const { rol } = esquemaFiltroUsuarios.parse(req.query);
    res.json(await usuarioService.listar(rol));
  },

  async crearAdministrador(req: Request, res: Response) {
    const datos = esquemaNuevoAdmin.parse(req.body);
    res.status(201).json(await usuarioService.crearAdministrador(datos));
  },

  async actualizar(req: Request, res: Response) {
    const { id } = esquemaId.parse(req.params);
    const cambios = esquemaActualizacionUsuario.parse(req.body);
    res.json(await usuarioService.actualizar(usuarioDe(req), id, cambios));
  },
};
