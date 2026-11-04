import type { ReactNode } from 'react';
import { ApiError } from '../api/cliente';

type Tipo = 'error' | 'exito' | 'info' | 'aviso';

/** Mensaje accesible: los errores se anuncian de inmediato, el resto de forma cortés. */
export function Alerta({ tipo = 'info', children }: { tipo?: Tipo; children: ReactNode }) {
  return (
    <div className={`alerta alerta--${tipo}`} role={tipo === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}

/** Muestra un error de la API con el detalle de cada campo inválido. */
export function ErrorApi({ error }: { error: unknown }) {
  if (!error) return null;
  const e = error instanceof ApiError ? error : null;
  return (
    <Alerta tipo="error">
      <strong>{e?.message ?? 'Ocurrió un error inesperado'}</strong>
      {e?.detalles && e.detalles.length > 0 && (
        <ul>
          {e.detalles.map((d) => (
            <li key={d.campo + d.mensaje}>{d.mensaje}</li>
          ))}
        </ul>
      )}
    </Alerta>
  );
}

export function Cargando({ texto = 'Cargando…' }: { texto?: string }) {
  return (
    <p className="cargando" role="status" aria-live="polite">
      {texto}
    </p>
  );
}

export function Vacio({ children }: { children: ReactNode }) {
  return <p className="vacio">{children}</p>;
}

export function Insignia({ tono, children }: { tono: string; children: ReactNode }) {
  return <span className={`insignia insignia--${tono}`}>{children}</span>;
}
