/** Error de negocio con código HTTP. Todo lo demás se responde como 500. */
export class ErrorApp extends Error {
  constructor(
    readonly status: number,
    readonly codigo: string,
    mensaje: string,
    readonly detalles?: unknown,
  ) {
    super(mensaje);
    this.name = 'ErrorApp';
  }
}

export const solicitudInvalida = (mensaje: string, detalles?: unknown) =>
  new ErrorApp(400, 'SOLICITUD_INVALIDA', mensaje, detalles);
export const noAutenticado = (mensaje = 'Debe iniciar sesión') => new ErrorApp(401, 'NO_AUTENTICADO', mensaje);
export const prohibido = (mensaje = 'No tiene permiso para esta acción') => new ErrorApp(403, 'PROHIBIDO', mensaje);
export const noEncontrado = (recurso: string) => new ErrorApp(404, 'NO_ENCONTRADO', `${recurso} no encontrado`);
export const conflicto = (mensaje: string, codigo = 'CONFLICTO') => new ErrorApp(409, codigo, mensaje);
export const reglaNegocio = (mensaje: string, codigo = 'REGLA_DE_NEGOCIO') => new ErrorApp(422, codigo, mensaje);
