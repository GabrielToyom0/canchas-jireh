import { Cargando, ErrorApi, Insignia, Vacio } from '../../components/Avisos';
import { useCarga } from '../../hooks/useCarga';
import { useTitulo } from '../../hooks/useTitulo';
import { pagosApi } from '../../api/recursos';
import { ESTADOS_PAGO, formatoFechaHora, formatoMoneda, METODOS_PAGO } from '../../utils/formato';

// HU-07: historial de pagos y reembolsos del cliente.
export default function MisPagosPage() {
  useTitulo('Mis pagos');
  const { datos, error, cargando } = useCarga(() => pagosApi.mios(), []);

  return (
    <>
      <div className="cabecera-pagina">
        <div>
          <h1>Mis pagos</h1>
          <p>Pagos realizados y reembolsos recibidos.</p>
        </div>
      </div>
      {cargando && <Cargando />}
      <ErrorApi error={error} />
      {datos && datos.length === 0 && <Vacio>Aún no tiene pagos registrados.</Vacio>}
      {datos && datos.length > 0 && (
        <div className="tabla-contenedor">
          <table className="tabla">
            <caption className="solo-lectores">Historial de pagos</caption>
            <thead>
              <tr>
                <th scope="col">Fecha</th>
                <th scope="col">Método</th>
                <th scope="col">Estado</th>
                <th scope="col" className="numero">
                  Monto
                </th>
                <th scope="col" className="numero">
                  Reembolso
                </th>
              </tr>
            </thead>
            <tbody>
              {datos.map((p) => (
                <tr key={p.id}>
                  <td>{formatoFechaHora(p.creadoEn)}</td>
                  <td>
                    {METODOS_PAGO[p.metodo]}
                    {p.ultimos4 && <span className="texto-suave"> ···· {p.ultimos4}</span>}
                  </td>
                  <td>
                    <Insignia tono={ESTADOS_PAGO[p.estado].tono}>{ESTADOS_PAGO[p.estado].texto}</Insignia>
                    {p.motivoRechazo && <div className="texto-suave texto-pequeno">{p.motivoRechazo}</div>}
                  </td>
                  <td className="numero">{formatoMoneda(p.monto)}</td>
                  <td className="numero">
                    {p.reembolsos?.length ? formatoMoneda(p.reembolsos.reduce((t, r) => t + r.monto, 0)) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
