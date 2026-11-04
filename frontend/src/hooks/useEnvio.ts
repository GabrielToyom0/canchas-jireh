import { useState } from 'react';

/** Estado de un envío de formulario: evita dobles clics y guarda el último error. */
export function useEnvio() {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<unknown>();

  async function ejecutar<T>(accion: () => Promise<T>): Promise<T | undefined> {
    if (enviando) return undefined;
    setEnviando(true);
    setError(undefined);
    try {
      return await accion();
    } catch (e) {
      setError(e);
      return undefined;
    } finally {
      setEnviando(false);
    }
  }

  return { enviando, error, setError, ejecutar };
}
