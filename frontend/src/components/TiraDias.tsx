import { partesDia, sumarDias } from '../utils/formato';
import { Segmentado } from './Campo';

/** Los próximos 7 días a un toque; para fechas más lejanas queda el selector de fecha. */
export function TiraDias({
  hoy,
  valor,
  alCambiar,
}: {
  hoy: string;
  valor: string;
  alCambiar: (fecha: string) => void;
}) {
  const dias = Array.from({ length: 7 }, (_, i) => sumarDias(hoy, i));
  return (
    <Segmentado
      leyenda="Fecha"
      nombre="fecha"
      variante="dias"
      valor={valor}
      alCambiar={alCambiar}
      opciones={dias.map((f, i) => {
        const { semana, dia, mes } = partesDia(f);
        return {
          valor: f,
          texto: (
            <>
              {i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : semana} <strong>{dia}</strong>{' '}
              <span className="solo-lectores">de {mes}</span>
            </>
          ),
        };
      })}
    >
      <div className="segmentado__extra">
        <label htmlFor="otra-fecha">Otra fecha</label>
        <input
          id="otra-fecha"
          type="date"
          value={dias.includes(valor) ? '' : valor}
          min={hoy}
          max={sumarDias(hoy, 60)}
          onChange={(e) => e.target.value && alCambiar(e.target.value)}
        />
      </div>
    </Segmentado>
  );
}
