import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react';

interface Base {
  etiqueta: string;
  error?: string;
  ayuda?: string;
}

/** Campo con etiqueta asociada, ayuda y error enlazados por aria-describedby (WCAG 1.3.1 / 3.3.1). */
export function Campo({ etiqueta, error, ayuda, id, ...props }: Base & InputHTMLAttributes<HTMLInputElement>) {
  const generado = useId();
  const idCampo = id ?? generado;
  const idAyuda = ayuda ? `${idCampo}-ayuda` : undefined;
  const idError = error ? `${idCampo}-error` : undefined;
  return (
    <div className="campo">
      <label htmlFor={idCampo}>
        {etiqueta}
        {props.required && <span aria-hidden="true"> *</span>}
      </label>
      <input
        id={idCampo}
        aria-invalid={error ? true : undefined}
        aria-describedby={[idAyuda, idError].filter(Boolean).join(' ') || undefined}
        {...props}
      />
      {ayuda && (
        <span id={idAyuda} className="campo__ayuda">
          {ayuda}
        </span>
      )}
      {error && (
        <span id={idError} className="campo__error">
          {error}
        </span>
      )}
    </div>
  );
}

export function Selector({
  etiqueta,
  error,
  ayuda,
  id,
  children,
  ...props
}: Base & SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  const generado = useId();
  const idCampo = id ?? generado;
  const idError = error ? `${idCampo}-error` : undefined;
  return (
    <div className="campo">
      <label htmlFor={idCampo}>
        {etiqueta}
        {props.required && <span aria-hidden="true"> *</span>}
      </label>
      <select id={idCampo} aria-invalid={error ? true : undefined} aria-describedby={idError} {...props}>
        {children}
      </select>
      {ayuda && <span className="campo__ayuda">{ayuda}</span>}
      {error && (
        <span id={idError} className="campo__error">
          {error}
        </span>
      )}
    </div>
  );
}

/** Grupo de opciones tipo "píldora" con radios nativos (navegable con teclado). */
export function Segmentado<T extends string>({
  leyenda,
  nombre,
  opciones,
  valor,
  alCambiar,
  variante,
  children,
}: {
  leyenda: string;
  nombre: string;
  opciones: { valor: T; texto: ReactNode }[];
  valor: T;
  alCambiar: (valor: T) => void;
  /** "dias": cada opción en dos líneas (día de la semana y número). */
  variante?: 'dias';
  /** Controles extra al final del grupo, como un selector de fecha libre. */
  children?: ReactNode;
}) {
  return (
    <fieldset className={variante ? `segmentado segmentado--${variante}` : 'segmentado'}>
      <legend>{leyenda}</legend>
      {opciones.map((o) => (
        <label key={o.valor}>
          <input
            type="radio"
            name={nombre}
            value={o.valor}
            checked={valor === o.valor}
            onChange={() => alCambiar(o.valor)}
          />
          <span>{o.texto}</span>
        </label>
      ))}
      {children}
    </fieldset>
  );
}
