import { prisma, type Db } from '../config/database.js';

export const refreshTokenRepository = {
  crear: (datos: { usuarioId: string; tokenHash: string; expiraEn: Date }, db: Db = prisma) =>
    db.refreshToken.create({ data: datos }),

  buscarPorHash: (tokenHash: string, db: Db = prisma) =>
    db.refreshToken.findUnique({ where: { tokenHash }, include: { usuario: true } }),

  /** Marca el token como usado; solo afecta si aún no estaba revocado. */
  marcarRotado: (id: string, momento: Date, db: Db = prisma) =>
    db.refreshToken.updateMany({ where: { id, revocado: false }, data: { revocado: true, reemplazadoEn: momento } }),

  revocarPorHash: (tokenHash: string, db: Db = prisma) =>
    db.refreshToken.updateMany({ where: { tokenHash }, data: { revocado: true } }),

  /** Cierra todas las sesiones del usuario. */
  revocarTodos: (usuarioId: string, db: Db = prisma) =>
    db.refreshToken.updateMany({ where: { usuarioId }, data: { revocado: true } }),
};
