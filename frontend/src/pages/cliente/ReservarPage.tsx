import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Alerta, Cargando, ErrorApi } from '../../components/Avisos';
import { Selector } from '../../components/Campo';
import { PaseReserva, PasosReserva } from '../../components/Reserva';
import { useCarga } from '../../hooks/useCarga';
import { useEnvio } from '../../hooks/useEnvio';
import { useTitulo } from '../../hooks/useTitulo';
import { politicasApi, reservasApi } from '../../api/recursos';
import { DEPORTES, formatoFechaLocal, formatoHora, formatoMoneda } from '../../utils/formato';
import { describirPolitica, horariosContiguos, totalEstimado } from '../../utils/calculos';

// HU-03: el cliente confirma el horario y la cantidad de horas antes de reservar.
export default function ReservarPage() {
  useTitulo('Confirmar reserva');
  const [params] = useSearchParams();
  const navegar = useNavigate();
  const canchaId = params.get('cancha') ?? '';
  const fecha = params.get('fecha') ?? '';
  const hora = params.get('hora') ?? '';
  const sedeId = params.get('sede') ?? '';
  const [horas, setHoras] = useState(1);
  const { enviando, error, ejecutar } = useEnvio();

  const disponibilidad = useCarga(
    () => reservasApi.disponibilidad({ sedeId, fecha }),
    [sedeId, fecha],
    !!sedeId && !!fecha,
  );
  const politica = useCarga(() => politicasApi.obtener(sedeId), [sedeId], !!sedeId);

  if (!canchaId || !fecha || !hora || !sedeId) {
    return (
      <Alerta tipo="error">
        Faltan datos de la reserva. <Link to="/">Vuelva a buscar un horario.</Link>
      </Alerta>
    );
  }
  if (disponibilidad.cargando) return <Cargando />;
  if (disponibilidad.error) return <ErrorApi error={disponibilidad.error} />;

  const cancha = disponibilidad.datos?.canchas.find((c) => c.id === canchaId);
  const libres = cancha ? horariosContiguos(cancha.horarios, hora) : [];
  if (!cancha || libres.length === 0) {
    return (
      <Alerta tipo="aviso">
        Ese horario ya no está disponible. <Link to={`/?sede=${sedeId}&fecha=${fecha}`}>Elija otro horario.</Link>
      </Alerta>
    );
  }

  const seleccion = libres.slice(0, horas);
  const total = totalEstimado(libres, horas);

  async function reservar() {
    const reserva = await ejecutar(() => reservasApi.crear({ canchaId, fecha, horaInicio: hora, horas }));
    if (reserva) navegar(`/reservas/${reserva.id}/pagar`, { replace: true });
  }

  return (
    <div className="reserva">
      <h1 id="titulo-reservar">Confirmar reserva</h1>
      <PasosReserva actual={2} />
      <PaseReserva
        cancha={cancha.nombre}
        detalle={`${DEPORTES[cancha.deporte]} en ${disponibilidad.datos!.sede.nombre}`}
        filas={[
          ['Fecha', formatoFechaLocal(fecha)],
          ['Horario', `${hora} a ${formatoHora(seleccion[seleccion.length - 1].fin)}`],
        ]}
        total={total}
      />
      <section className="tarjeta formulario" aria-labelledby="titulo-reservar">
        <ErrorApi error={error} />
        <Selector
          etiqueta="Duración"
          value={horas}
          onChange={(e) => setHoras(Number(e.target.value))}
          ayuda={libres.length < 8 ? `Hay ${libres.length} hora(s) seguidas libres desde las ${hora}.` : undefined}
        >
          {libres.map((_, i) => (
            <option key={i} value={i + 1}>
              {i + 1} {i === 0 ? 'hora' : 'horas'}
            </option>
          ))}
        </Selector>
        <table className="tabla">
          <caption className="solo-lectores">Detalle del precio por hora</caption>
          <thead>
            <tr>
              <th scope="col">Hora</th>
              <th scope="col" className="numero">
                Precio
              </th>
            </tr>
          </thead>
          <tbody>
            {seleccion.map((h) => (
              <tr key={h.hora}>
                <td>{h.hora}</td>
                <td className="numero">{formatoMoneda(h.precio ?? 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Alerta tipo="info">
          Al reservar, el horario queda apartado y tiene <strong>15 minutos</strong> para pagar; si no, se libera
          automáticamente.
        </Alerta>
        {politica.datos && (
          <details>
            <summary>Política de cancelación de esta sede</summary>
            <ul>
              {describirPolitica(politica.datos.reglas).map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </details>
        )}
        <div className="fila fila--fin">
          <Link className="boton boton--secundario" to={`/?sede=${sedeId}&fecha=${fecha}`}>
            Volver
          </Link>
          <button type="button" className="boton" onClick={reservar} disabled={enviando}>
            {enviando ? 'Reservando…' : `Reservar y pagar ${formatoMoneda(total)}`}
          </button>
        </div>
      </section>
    </div>
  );
}
