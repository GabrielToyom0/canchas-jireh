import { useAhora } from './useAhora';

/** Segundos que faltan para `hasta` (ISO), o null si no hay límite. Se actualiza cada segundo. */
export function useCuentaRegresiva(hasta: string | null | undefined): number | null {
  const ahora = useAhora(1000, !!hasta);
  return hasta ? Math.max(0, Math.floor((Date.parse(hasta) - ahora) / 1000)) : null;
}

export const formatoMinutos = (segundos: number) =>
  `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, '0')}`;
