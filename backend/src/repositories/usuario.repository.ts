import { prisma, type Db } from '../config/database.js';
import type { Prisma } from '../generated/prisma/client.js';
import type { Rol } from '../models/enums.js';

export const usuarioRepository = {
  buscarPorId: (id: string, db: Db = prisma) => db.usuario.findUnique({ where: { id } }),

  buscarPorCorreo: (correo: string, db: Db = prisma) => db.usuario.findUnique({ where: { correo } }),

  existePropietario: async (db: Db = prisma) => (await db.usuario.count({ where: { rol: 'PROPIETARIO' } })) > 0,

  listar: (rol?: Rol, db: Db = prisma) => db.usuario.findMany({ where: { rol }, orderBy: { creadoEn: 'desc' } }),

  crear: (datos: Prisma.UsuarioUncheckedCreateInput, db: Db = prisma) => db.usuario.create({ data: datos }),

  actualizar: (id: string, cambios: Prisma.UsuarioUncheckedUpdateInput, db: Db = prisma) =>
    db.usuario.update({ where: { id }, data: cambios }),
};
