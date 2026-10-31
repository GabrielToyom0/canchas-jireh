import { useEffect, useId, useRef, type ReactNode } from 'react';

/**
 * Diálogo modal con <dialog> nativo: atrapa el foco, se cierra con Escape
 * y devuelve el foco al elemento que lo abrió.
 */
export function Dialogo({
  abierto,
  titulo,
  alCerrar,
  children,
}: {
  abierto: boolean;
  titulo: string;
  alCerrar: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const idTitulo = useId();

  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    if (abierto && !dialogo.open) dialogo.showModal?.();
    if (!abierto && dialogo.open) dialogo.close?.();
  }, [abierto]);

  return (
    <dialog ref={ref} className="dialogo" aria-labelledby={idTitulo} onClose={alCerrar} onCancel={alCerrar}>
      {abierto && (
        <div className="dialogo__contenido">
          <h2 id={idTitulo}>{titulo}</h2>
          {children}
        </div>
      )}
    </dialog>
  );
}
