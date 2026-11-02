import { useState } from 'react';
import { Cargando, ErrorApi, Vacio } from '../../components/Avisos';
import { Campo } from '../../components/Campo';
import { useAuth } from '../../context/AuthContext';
import { useCarga } from '../../hooks/useCarga';
import { useTitulo } from '../../hooks/useTitulo';
import { reportesApi } from '../../api/recursos';
import type { MetodoPago } from '../../types';
import { formatoMoneda, hoyGuatemala, METODOS_PAGO, sumarDias } from '../../utils/formato';

const primerDiaDelMes = (fecha: string) => `${fecha.slice(0, 8)}01`;

// HU-12 / OE5: ingresos y ocupación por sede.
export default function ReportesPage() {
  useTitulo('Reportes');
  const { usuario } = useAuth();
  const hoy = hoyGuatemala();
  const [desde, setDesde] = useState(primerDiaDelMes(hoy));
  const [hasta, setHasta] = useState(hoy);
  const rangoValido = desde <= hasta;

  const reportes = useCarga(
    () => Promise.all([reportesApi.ingresos(desde, hasta), reportesApi.ocupacion(desde, hasta)]),
    [desde, hasta],
    rangoValido,
  );
  const [ingresos, ocupacion] = reportes.datos ?? [];

  const filas = (ocupacion?.sedes ?? []).map((o) => ({
    ...o,
    ingresos: ingresos?.sedes.find((i) => i.sedeId === o.sedeId),
  }));
  const total = (campo: 'cobrado' | 'reembolsado' | 'neto') => ingresos?.sedes.reduce((t, s) => t + s[campo], 0) ?? 0;
  const horasOcupadas = filas.reduce((t, f) => t + f.horasOcupadas, 0);
  const horasDisponibles = filas.reduce((t, f) => t + f.horasDisponibles, 0);

  const presets = [
    { texto: 'Este mes', desde: primerDiaDelMes(hoy), hasta: hoy },
    { texto: 'Últimos 7 días', desde: sumarDias(hoy, -6), hasta: hoy },
    { texto: 'Próximos 7 días', desde: hoy, hasta: sumarDias(hoy, 6) },
  ];

  return (
    <>
      <div className="cabecera-pagina">
        <div>
          <h1>Reportes</h1>
          <p>{usuario?.rol === 'PROPIETARIO' ? 'Consolidado de todas las sedes.' : 'Resultados de su sede.'}</p>
        </div>
      </div>
      <div className="tarjeta">
        <div className="formulario formulario--columnas">
          <Campo
            etiqueta="Desde"
            type="date"
            value={desde}
            onChange={(e) => e.target.value && setDesde(e.target.value)}
          />
          <Campo
            etiqueta="Hasta"
            type="date"
            value={hasta}
            onChange={(e) => e.target.value && setHasta(e.target.value)}
            error={rangoValido ? undefined : 'Debe ser posterior a la fecha inicial'}
          />
        </div>
        <div className="fila separado-poco">
          {presets.map((p) => (
            <button
              key={p.texto}
              type="button"
              className="boton boton--fantasma boton--pequeno"
              aria-pressed={desde === p.desde && hasta === p.hasta}
              onClick={() => {
                setDesde(p.desde);
                setHasta(p.hasta);
              }}
            >
              {p.texto}
            </button>
          ))}
        </div>
      </div>

      <ErrorApi error={reportes.error} />
      {reportes.cargando && <Cargando texto="Generando reportes…" />}
      {reportes.datos && (
        <>
          <dl className="cifras separado-grande">
            <div className="cifra">
              <dt>Cobrado</dt>
              <dd>{formatoMoneda(total('cobrado'))}</dd>
            </div>
            <div className="cifra">
              <dt>Reembolsado</dt>
              <dd>{formatoMoneda(total('reembolsado'))}</dd>
            </div>
            <div className="cifra">
              <dt>Ingreso neto</dt>
              <dd>{formatoMoneda(total('neto'))}</dd>
            </div>
            <div className="cifra">
              <dt>Ocupación</dt>
              <dd>{horasDisponibles ? Math.round((horasOcupadas / horasDisponibles) * 1000) / 10 : 0} %</dd>
            </div>
          </dl>

          {filas.length === 0 ? (
            <Vacio>No hay sedes para mostrar.</Vacio>
          ) : (
            <div className="tabla-contenedor">
              <table className="tabla">
                <caption>Detalle por sede</caption>
                <thead>
                  <tr>
                    <th scope="col">Sede</th>
                    <th scope="col">Ocupación</th>
                    <th scope="col" className="numero">
                      Horas ocupadas
                    </th>
                    <th scope="col" className="numero">
                      Cobrado
                    </th>
                    <th scope="col" className="numero">
                      Reembolsado
                    </th>
                    <th scope="col" className="numero">
                      Neto
                    </th>
                    <th scope="col">Por método</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((f) => (
                    <tr key={f.sedeId}>
                      <th scope="row">{f.sedeNombre}</th>
                      <td>
                        <div className="fila fila--sin-salto">
                          <div className="barra" role="img" aria-label={`${f.porcentajeOcupacion} % de ocupación`}>
                            <span style={{ width: `${Math.min(100, f.porcentajeOcupacion)}%` }} />
                          </div>
                          <span>{f.porcentajeOcupacion} %</span>
                        </div>
                      </td>
                      <td className="numero">
                        {f.horasOcupadas} / {f.horasDisponibles}
                      </td>
                      <td className="numero">{formatoMoneda(f.ingresos?.cobrado ?? 0)}</td>
                      <td className="numero">{formatoMoneda(f.ingresos?.reembolsado ?? 0)}</td>
                      <td className="numero">
                        <strong>{formatoMoneda(f.ingresos?.neto ?? 0)}</strong>
                      </td>
                      <td className="texto-pequeno">
                        {Object.entries(f.ingresos?.porMetodo ?? {})
                          .map(([m, v]) => `${METODOS_PAGO[m as MetodoPago]}: ${formatoMoneda(v ?? 0)}`)
                          .join(' · ') || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  );
}
