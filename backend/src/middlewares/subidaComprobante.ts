import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { open, unlink } from 'node:fs/promises';
import path from 'node:path';
import type { RequestHandler } from 'express';
import multer from 'multer';
import { env } from '../config/env.js';
import { ErrorApp, solicitudInvalida } from '../utils/errores.js';

const carpetaComprobantes = path.resolve(env.UPLOADS_DIR);
mkdirSync(carpetaComprobantes, { recursive: true });

const EXTENSIONES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
};

export const TIPOS_POR_EXTENSION: Record<string, string> = Object.fromEntries(
  Object.entries(EXTENSIONES).map(([tipo, ext]) => [ext, tipo]),
);

/** Subida de comprobantes: tamaño limitado, nombre aleatorio y solo imágenes o PDF (OWASP). */
const subir = multer({
  storage: multer.diskStorage({
    destination: carpetaComprobantes,
    filename: (_req, archivo, cb) => cb(null, `${randomUUID()}${EXTENSIONES[archivo.mimetype]}`),
  }),
  limits: { fileSize: env.MAX_COMPROBANTE_MB * 1024 * 1024, files: 1, fields: 10 },
  fileFilter: (_req, archivo, cb) => {
    if (EXTENSIONES[archivo.mimetype]) return cb(null, true);
    cb(solicitudInvalida('El comprobante debe ser una imagen (JPG, PNG, WEBP) o un PDF'));
  },
}).single('comprobante');

/** Ejecuta multer y convierte sus errores en respuestas 400/413 claras. */
export const recibirComprobante: RequestHandler = (req, res, next) => {
  subir(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      return next(
        err.code === 'LIMIT_FILE_SIZE'
          ? new ErrorApp(413, 'ARCHIVO_MUY_GRANDE', `El comprobante supera ${env.MAX_COMPROBANTE_MB} MB`)
          : solicitudInvalida('Archivo inválido'),
      );
    }
    next(err);
  });
};

// Firma real del archivo: el tipo que declara el navegador se puede falsificar.
const FIRMAS: Record<string, (b: Buffer) => boolean> = {
  '.pdf': (b) => b.subarray(0, 4).toString('latin1') === '%PDF',
  '.png': (b) => b.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47])),
  '.jpg': (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  '.webp': (b) => b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP',
};

export async function contenidoCoincide(ruta: string): Promise<boolean> {
  const archivo = await open(ruta, 'r');
  try {
    const { buffer } = await archivo.read(Buffer.alloc(12), 0, 12, 0);
    return FIRMAS[path.extname(ruta)]?.(buffer) ?? false;
  } finally {
    await archivo.close();
  }
}

export const borrarArchivo = (ruta: string) => unlink(ruta).catch(() => undefined);

/** Ruta absoluta de un comprobante guardado; impide salir de la carpeta (path traversal). */
export function rutaComprobante(nombre: string): string {
  const ruta = path.resolve(carpetaComprobantes, path.basename(nombre));
  if (!ruta.startsWith(carpetaComprobantes)) throw solicitudInvalida('Archivo inválido');
  return ruta;
}
