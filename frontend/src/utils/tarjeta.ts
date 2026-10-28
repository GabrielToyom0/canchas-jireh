/** "4242424242424242" → "4242 4242 4242 4242" mientras se escribe. */
export const agruparNumero = (valor: string) =>
  valor
    .replace(/\D/g, '')
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, '$1 ');

/** "1230" → "12/30" */
export const formatoExpiracion = (valor: string) => {
  const d = valor.replace(/\D/g, '').slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};
