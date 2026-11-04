import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';

const COSTO_BCRYPT = 12;

export const hashPassword = (password: string) => bcrypt.hash(password, COSTO_BCRYPT);
export const compararPassword = (password: string, hash: string) => bcrypt.compare(password, hash);

/** Token de renovación opaco: 48 bytes aleatorios. Solo se guarda su hash. */
export const generarRefreshToken = () => randomBytes(48).toString('base64url');
export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

// Cuando el correo no existe se compara igual contra un hash, para que el tiempo de
// respuesta no revele qué correos están registrados.
let hashFicticio: Promise<string> | undefined;
export const compararConHashFicticio = async (password: string) => {
  hashFicticio ??= bcrypt.hash(randomBytes(16).toString('hex'), COSTO_BCRYPT);
  await bcrypt.compare(password, await hashFicticio);
  return false;
};
