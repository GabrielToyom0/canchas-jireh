import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Alerta, Cargando, ErrorApi, Vacio } from '../../components/Avisos';
import { Segmentado, Selector } from '../../components/Campo';
import { useAuth } from '../../context/AuthContext';
import { useCarga } from '../../hooks/useCarga';
import { useTitulo } from '../../hooks/useTitulo';
import { reservasApi, sedesApi } from '../../api/recursos';
import type { Deporte, Horario } from '../../types';
import { DEPORTES, formatoFechaLocal, hoyGuatemala } from '../../utils/formato';
import { TiraDias } from '../../components/TiraDias';
import { GrillaDisponibilidad, LeyendaHorarios } from '../../components/GrillaDisponibilidad';

type FiltroDeporte = Deporte | 'TODOS';

/**
 * Pantalla principal (RF-16, HU-02): buscar canchas por sede, deporte y fecha.
 * Los filtros viven en la URL para poder compartir o recargar la búsqueda.
 */
export function BusquedaPage() {
  useTitulo('Buscar canchas');
  const { usuario } = useAuth();
  const navegar = useNavigate();
  const [params, setParams] = useSearchParams();
  const hoy = hoyGuatemala();
  const sedeId = params.get('sede') ?? '';
  const fecha = params.get('fecha') ?? hoy;
  const deporte = (params.get('deporte') ?? 'TODOS') as FiltroDeporte;

  const { datos: sedes, error: errorSedes } = useCarga(() => sedesApi.listar(), []);

  // replace: cambiar un filtro no crea una entrada de historial; "Atrás" sale de la búsqueda.
  const fijar = (cambios: Record<string, string>) =>
    setParams(
      (p) => {
        const nuevo = new URLSearchParams(p);
        for (const [k, v] of Object.entries(cambios)) nuevo.set(k, v);
        return nuevo;
      },
      { replace: true },
    );

  // Primera visita: elegir la primera sede automáticamente.
  useEffect(() => {
    if (!sedeId && sedes?.length) fijar({ sede: sedes[0].id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sedes, sedeId]);

  const disponibilidad = useCarga(
    () => reservasApi.disponibilidad({ sedeId, fecha, deporte: deporte === 'TODOS' ? undefined : deporte }),
    [sedeId, fecha, deporte],
    !!sedeId,
  );

  function elegir(canchaId: string, horario: Horario) {
    const destino = `/reservar?cancha=${canchaId}&fecha=${fecha}&hora=${horario.hora}&sede=${sedeId}`;
    if (!usuario) navegar('/ingresar', { state: { volverA: destino } });
    else navegar(destino);
  }

  return (
    <>
      <section className="portada" aria-labelledby="titulo-busqueda">
        <MarcajeCancha />
        <div className="portada__texto">
          <h1 id="titulo-busqueda">Reserva tu cancha en minutos</h1>
          <p>Elige la sede, el deporte y el día. Verás los horarios libres con su precio y podrás pagar en línea.</p>
        </div>
      </section>

      <section className="buscador" aria-label="Filtros de búsqueda">
        {!!errorSedes && (
          <div className="buscador__aviso">
            <ErrorApi error={errorSedes} />
          </div>
        )}
        <Selector etiqueta="Sede" value={sedeId} onChange={(e) => fijar({ sede: e.target.value })}>
          {!sedes && <option value="">Cargando sedes…</option>}
          {sedes?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nombre} — {s.zona}
            </option>
          ))}
        </Selector>
        <TiraDias hoy={hoy} valor={fecha} alCambiar={(f) => fijar({ fecha: f })} />
        <div className="buscador__deporte">
          <Segmentado<FiltroDeporte>
            leyenda="Deporte"
            nombre="deporte"
            valor={deporte}
            alCambiar={(d) => fijar({ deporte: d })}
            opciones={[
              { valor: 'TODOS', texto: 'Todos' },
              ...(Object.keys(DEPORTES) as Deporte[]).map((d) => ({ valor: d, texto: DEPORTES[d] })),
            ]}
          />
        </div>
      </section>

      <section className="resultados" aria-labelledby="titulo-resultados">
        <div className="cabecera-pagina">
          <div>
            <h2 id="titulo-resultados">Horarios para el {formatoFechaLocal(fecha)}</h2>
            {disponibilidad.datos && (
              <p>
                {disponibilidad.datos.sede.nombre} · abierto de {disponibilidad.datos.sede.horaApertura} a{' '}
                {disponibilidad.datos.sede.horaCierre}
              </p>
            )}
          </div>
        </div>
        {usuario && usuario.rol !== 'CLIENTE' && (
          <Alerta tipo="info">
            Está viendo la disponibilidad como {usuario.rol === 'PROPIETARIO' ? 'propietario' : 'administrador'}; las
            reservas las hacen los clientes.
          </Alerta>
        )}
        <LeyendaHorarios />
        <div aria-live="polite" aria-busy={disponibilidad.cargando}>
          {disponibilidad.cargando && <Cargando texto="Buscando horarios…" />}
          <ErrorApi error={disponibilidad.error} />
          {disponibilidad.datos &&
            !disponibilidad.cargando &&
            (disponibilidad.datos.canchas.length ? (
              <GrillaDisponibilidad
                disponibilidad={disponibilidad.datos}
                alElegir={elegir}
                soloLectura={!!usuario && usuario.rol !== 'CLIENTE'}
              />
            ) : (
              <Vacio>No hay canchas de este deporte en la sede seleccionada.</Vacio>
            ))}
        </div>
      </section>
    </>
  );
}

/** Marcaje de una cancha de fútbol 5 vista desde arriba; decorativo. */
function MarcajeCancha() {
  return (
    <svg
      className="portada__cancha"
      viewBox="0 0 400 240"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="4" y="4" width="392" height="232" rx="2" />
      <line x1="200" y1="4" x2="200" y2="236" />
      <circle cx="200" cy="120" r="36" />
      <circle cx="200" cy="120" r="3" fill="currentColor" />
      <path d="M4 60 h46 a60 60 0 0 1 0 120 h-46" />
      <path d="M396 60 h-46 a60 60 0 0 0 0 120 h46" />
      <circle cx="74" cy="120" r="2.5" fill="currentColor" />
      <circle cx="326" cy="120" r="2.5" fill="currentColor" />
    </svg>
  );
}
