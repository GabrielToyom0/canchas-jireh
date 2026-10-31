// Validación en el navegador para dar retroalimentación inmediata.
// El servidor aplica las mismas reglas: esta capa no sustituye a la del backend.

export interface DatosRegistro {
  nombre: string;
  correo: string;
  telefono: string;
  password: string;
  confirmacion: string;
}

export type ErroresRegistro = Partial<Record<keyof DatosRegistro, string>>;

export function validarRegistro(d: DatosRegistro): ErroresRegistro {
  const errores: ErroresRegistro = {};
  if (d.nombre.trim().length < 2) errores.nombre = 'Ingrese su nombre completo';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.correo.trim())) errores.correo = 'Ingrese un correo válido';
  if (!/^\+?[\d\s-]{8,20}$/.test(d.telefono.trim())) errores.telefono = 'Ingrese un teléfono válido (8 dígitos o más)';
  if (d.password.length < 8) errores.password = 'Mínimo 8 caracteres';
  else if (!/[A-Za-z]/.test(d.password) || !/\d/.test(d.password)) errores.password = 'Incluya letras y números';
  if (d.confirmacion !== d.password) errores.confirmacion = 'Las contraseñas no coinciden';
  return errores;
}
