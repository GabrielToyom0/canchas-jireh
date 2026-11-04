import { ApiError } from '../api/cliente';

/** Error de un campo concreto devuelto por la validación del servidor. */
export function errorDeCampo(error: unknown, campo: string): string | undefined {
  if (!(error instanceof ApiError)) return undefined;
  return error.detalles?.find((d) => d.campo === campo)?.mensaje;
}
