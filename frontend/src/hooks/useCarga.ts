import { useCallback, useEffect, useEffectEvent, useState } from 'react';

interface EstadoCarga<T> {
  datos: T | undefined;
  error: unknown;
  cargando: boolean;
  recargar: () => void;
}

/**
 * Ejecuta una consulta cuando cambian sus dependencias y expone datos, error y carga.
 * Las respuestas de consultas viejas se descartan (evita mostrar datos de otra sede o fecha).
 * Mientras carga, conserva los datos anteriores para que la pantalla no parpadee.
 */
export function useCarga<T>(
  consulta: () => Promise<T>,
  dependencias: readonly unknown[],
  activa = true,
): EstadoCarga<T> {
  const [version, setVersion] = useState(0);
  const clave = JSON.stringify([...dependencias, version]);
  const [resultado, setResultado] = useState<{ clave: string; datos?: T; error?: unknown }>({ clave: '' });
  const obtener = useEffectEvent(consulta);

  useEffect(() => {
    if (!activa) return;
    let vigente = true;
    obtener()
      .then((datos) => vigente && setResultado({ clave, datos }))
      .catch((error: unknown) => vigente && setResultado((previo) => ({ clave, datos: previo.datos, error })));
    return () => {
      vigente = false;
    };
  }, [clave, activa]);

  const recargar = useCallback(() => setVersion((v) => v + 1), []);
  const vigente = resultado.clave === clave;
  return {
    datos: resultado.datos,
    error: vigente ? resultado.error : undefined,
    cargando: activa && !vigente,
    recargar,
  };
}
