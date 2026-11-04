export function leerCookie(encabezado: string | undefined, nombre: string): string | undefined {
  if (!encabezado) return undefined;
  for (const parte of encabezado.split(';')) {
    const [clave, ...valor] = parte.trim().split('=');
    if (clave === nombre) return decodeURIComponent(valor.join('='));
  }
  return undefined;
}
