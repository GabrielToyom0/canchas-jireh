import type { Disponibilidad, EstadoHorario, Horario } from '../types';
import { DEPORTES, formatoMoneda } from '../utils/formato';

const TEXTO_ESTADO: Record<EstadoHorario, string> = {
  DISPONIBLE: 'Disponible',
  OCUPADO: 'Ocupado',
  BLOQUEADO: 'Bloqueado',
  PASADO: 'Ya pasó',
  SIN_TARIFA: 'Sin tarifa',
};

export function LeyendaHorarios() {
  return (
    <ul className="leyenda" aria-label="Significado de los colores">
      {(['DISPONIBLE', 'OCUPADO', 'BLOQUEADO', 'PASADO'] as const).map((e) => (
        <li key={e}>
          <span className={`horario--${e}`} aria-hidden="true" />
          {TEXTO_ESTADO[e]}
        </li>
      ))}
    </ul>
  );
}

/**
 * RF-07 / RF-16: horarios de cada cancha con su precio.
 * Solo los horarios disponibles son botones; el estado también se dice con texto (no solo color).
 */
export function GrillaDisponibilidad({
  disponibilidad,
  alElegir,
  soloLectura = false,
}: {
  disponibilidad: Disponibilidad;
  alElegir: (canchaId: string, horario: Horario) => void;
  /** Administradores y propietario consultan pero no reservan. */
  soloLectura?: boolean;
}) {
  return (
    <div className="rejilla">
      {disponibilidad.canchas.map((cancha) => {
        const libres = cancha.horarios.filter((h) => h.estado === 'DISPONIBLE').length;
        return (
          <article key={cancha.id} className="tarjeta cancha" aria-labelledby={`cancha-${cancha.id}`}>
            <div className="tarjeta__cabecera">
              <div>
                <h3 id={`cancha-${cancha.id}`}>{cancha.nombre}</h3>
                <p className="texto-suave texto-pequeno">
                  {DEPORTES[cancha.deporte]} · {cancha.superficie} · hasta {cancha.capacidad} jugadores
                </p>
              </div>
              <span className={`insignia insignia--${libres ? 'verde' : 'gris'}`}>
                {libres} {libres === 1 ? 'libre' : 'libres'}
              </span>
            </div>
            <ul className="horarios" aria-label={`Horarios de ${cancha.nombre}`}>
              {cancha.horarios.map((h) => {
                const reservable = h.estado === 'DISPONIBLE' && !soloLectura;
                // El texto visible forma parte del nombre accesible (WCAG 2.5.3); el contexto extra es solo para lectores.
                const contenido = (
                  <>
                    {reservable && <span className="solo-lectores">Reservar {cancha.nombre} a las</span>}{' '}
                    <strong>{h.hora}</strong>{' '}
                    <small>
                      {h.estado === 'DISPONIBLE' && h.precio !== null
                        ? formatoMoneda(h.precio)
                        : TEXTO_ESTADO[h.estado]}
                    </small>
                    {reservable && (
                      <>
                        {' '}
                        <span className="solo-lectores">por hora</span>
                      </>
                    )}
                  </>
                );
                return (
                  <li key={h.hora}>
                    {reservable ? (
                      <button
                        type="button"
                        className="horario horario--DISPONIBLE"
                        onClick={() => alElegir(cancha.id, h)}
                      >
                        {contenido}
                      </button>
                    ) : (
                      <div className={`horario horario--${h.estado}`}>{contenido}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </article>
        );
      })}
    </div>
  );
}
