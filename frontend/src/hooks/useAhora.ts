import { useEffect, useState } from 'react';

/** Hora actual (ms) que se actualiza cada `intervaloMs`. Mantiene el render puro. */
export function useAhora(intervaloMs = 30_000, activo = true): number {
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    if (!activo) return;
    const id = setInterval(() => setAhora(Date.now()), intervaloMs);
    return () => clearInterval(id);
  }, [intervaloMs, activo]);
  return ahora;
}
