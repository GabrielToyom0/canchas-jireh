import { useEffect } from 'react';

/** Título de la pestaña por página: ayuda a lectores de pantalla y al historial. */
export function useTitulo(titulo: string) {
  useEffect(() => {
    document.title = `${titulo} · Canchas Jireh`;
  }, [titulo]);
}
