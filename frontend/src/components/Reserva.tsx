import { Fragment, type ReactNode } from 'react';
import { formatoMoneda } from '../utils/formato';

const PASOS = ['Elegir horario', 'Confirmar', 'Pagar'] as const;

/** Ubica a la persona dentro del flujo de reserva; el paso actual se anuncia con aria-current. */
export function PasosReserva({ actual }: { actual: 1 | 2 | 3 }) {
  return (
    <ol className="pasos" aria-label="Pasos de la reserva">
      {PASOS.map((texto, i) => {
        const n = i + 1;
        return (
          <li
            key={texto}
            className={n < actual ? 'pasos--hecho' : undefined}
            aria-current={n === actual ? 'step' : undefined}
          >
            <span className="pasos__texto">{texto}</span>
            {n < actual && <span className="solo-lectores"> (completado)</span>}
          </li>
        );
      })}
    </ol>
  );
}

/** Resumen de la reserva con forma de pase de entrada a la cancha. */
export function PaseReserva({
  cancha,
  detalle,
  filas,
  total,
}: {
  cancha: string;
  detalle: string;
  filas: [string, ReactNode][];
  total: number;
}) {
  return (
    <section className="pase" aria-label="Resumen de la reserva">
      <div className="pase__cabecera">
        <h2>{cancha}</h2>
        <p>{detalle}</p>
      </div>
      <div className="pase__corte" aria-hidden="true" />
      <div className="pase__cuerpo">
        <dl className="lista-definiciones">
          {filas.map(([termino, valor]) => (
            <Fragment key={termino}>
              <dt>{termino}</dt>
              <dd>{valor}</dd>
            </Fragment>
          ))}
        </dl>
        <p className="pase__total">
          <span>Total</span>
          <strong>{formatoMoneda(total)}</strong>
        </p>
      </div>
    </section>
  );
}
