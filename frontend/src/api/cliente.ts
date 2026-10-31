// Cliente HTTP. El access token vive solo en memoria (no en localStorage) para reducir
// el impacto de un XSS; el refresh token viaja en una cookie httpOnly que JavaScript no puede leer.

import type { Usuario } from '../types';

const BASE = import.meta.env.VITE_API_URL ?? '/api';

export class ApiError extends Error {
  status: number;
  codigo: string;
  detalles?: { campo: string; mensaje: string }[];

  constructor(status: number, codigo: string, mensaje: string, detalles?: { campo: string; mensaje: string }[]) {
    super(mensaje);
    this.status = status;
    this.codigo = codigo;
    this.detalles = detalles;
  }
}

let accessToken: string | null = null;
let alExpirarSesion: () => void = () => {};
let renovacionEnCurso: Promise<Sesion | null> | null = null;

export const fijarToken = (token: string | null) => {
  accessToken = token;
};
export const alCerrarSesionForzada = (fn: () => void) => {
  alExpirarSesion = fn;
};

export interface Sesion {
  accessToken: string;
  usuario: Usuario;
}

async function pedirRenovacion(): Promise<Sesion | null> {
  try {
    const r = await fetch(`${BASE}/auth/refresh`, { method: 'POST', credentials: 'include' });
    return r.ok ? ((await r.json()) as Sesion) : null;
  } catch {
    return null;
  }
}

/**
 * Pide una nueva sesión con la cookie de renovación.
 * Todas las llamadas simultáneas comparten la misma petición: el refresh token se rota en cada uso.
 */
export function renovarSesion(): Promise<Sesion | null> {
  renovacionEnCurso ??= pedirRenovacion()
    .then((sesion) => {
      fijarToken(sesion?.accessToken ?? null);
      return sesion;
    })
    .finally(() => {
      renovacionEnCurso = null;
    });
  return renovacionEnCurso;
}

const renovarUnaVez = async () => (await renovarSesion()) !== null;

interface Opciones {
  metodo?: string;
  cuerpo?: unknown;
  formulario?: FormData;
  /** No intentar renovar la sesión ante un 401 (rutas de login/registro). */
  sinRenovar?: boolean;
}

export async function solicitar<T>(ruta: string, opciones: Opciones = {}, reintento = false): Promise<T> {
  const encabezados: Record<string, string> = {};
  if (accessToken) encabezados.authorization = `Bearer ${accessToken}`;
  if (opciones.cuerpo !== undefined) encabezados['content-type'] = 'application/json';

  let respuesta: Response;
  try {
    respuesta = await fetch(`${BASE}${ruta}`, {
      method: opciones.metodo ?? 'GET',
      headers: encabezados,
      body: opciones.formulario ?? (opciones.cuerpo !== undefined ? JSON.stringify(opciones.cuerpo) : undefined),
      credentials: 'include',
    });
  } catch {
    throw new ApiError(0, 'SIN_CONEXION', 'No se pudo conectar con el servidor. Revise su conexión.');
  }

  if (respuesta.status === 401 && !opciones.sinRenovar && !reintento && accessToken) {
    if (await renovarUnaVez()) return solicitar<T>(ruta, opciones, true);
    alExpirarSesion();
  }

  if (respuesta.status === 204) return undefined as T;
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    throw new ApiError(
      respuesta.status,
      datos.codigo ?? 'ERROR',
      datos.mensaje ?? 'Ocurrió un error inesperado',
      datos.detalles,
    );
  }
  return datos as T;
}

/** Descarga un archivo protegido (el comprobante) y devuelve una URL local para abrirlo. */
export async function descargarArchivo(ruta: string): Promise<string> {
  const r = await fetch(`${BASE}${ruta}`, {
    headers: accessToken ? { authorization: `Bearer ${accessToken}` } : {},
    credentials: 'include',
  });
  if (!r.ok) throw new ApiError(r.status, 'ERROR', 'No se pudo abrir el archivo');
  return URL.createObjectURL(await r.blob());
}

export const api = {
  get: <T>(ruta: string) => solicitar<T>(ruta),
  post: <T>(ruta: string, cuerpo?: unknown) => solicitar<T>(ruta, { metodo: 'POST', cuerpo: cuerpo ?? {} }),
  put: <T>(ruta: string, cuerpo: unknown) => solicitar<T>(ruta, { metodo: 'PUT', cuerpo }),
  patch: <T>(ruta: string, cuerpo: unknown) => solicitar<T>(ruta, { metodo: 'PATCH', cuerpo }),
  delete: <T = void>(ruta: string) => solicitar<T>(ruta, { metodo: 'DELETE' }),
  formulario: <T>(ruta: string, formulario: FormData) => solicitar<T>(ruta, { metodo: 'POST', formulario }),
};
