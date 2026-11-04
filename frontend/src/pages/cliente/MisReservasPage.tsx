import { useState } from 'react';
import { Link } from 'react-router';
import { Alerta, Cargando, ErrorApi, Insignia, Vacio } from '../../components/Avisos';
import { useAhora } from '../../hooks/useAhora';
import { useCarga } from '../../hooks/useCarga';
import { useTitulo } from '../../hooks/useTitulo';
import { reservasApi } from '../../api/recursos';
import type { Reserva } from '../../types';
import { DEPORTES, ESTADOS_RESERVA, formatoMoneda, formatoRango } from '../../utils/formato';
import { DialogoCancelar } from '../../components/DialogoCancelar';

const esProxima = (r: Reserva, ahora: number) =>
  ['PENDIENTE', 'CONFIRMADA'].includes(r.estado) && Date.parse(r.fin) > ahora;

// HU-07: historial del cliente. HU-06: cancelación con reembolso.
export default function MisReservasPage() {
  useTitulo('Mis reservas');
  const ahora = useAhora();
  const { datos, error, cargando, recargar } = useCarga(() => reservasApi.mias(), []);
  const [vista, setVista] = useState<'proximas' | 'historial'>('proximas');
  const [aCancelar, setACancelar] = useState<Reserva | null>(null);
  const [aviso, setAviso] = useState<string>();

  const proximas = datos?.filter((r) => esProxima(r, ahora)).sort((a, b) => a.inicio.localeCompare(b.inicio)) ?? [];
  const historial = datos?.filter((r) => !esProxima(r, ahora)) ?? [];
  const lista = vista === 'proximas' ? proximas : historial;

  return (
    <>
      <div className="cabecera-pagina">
        <div>
          <h1>Mis reservas</h1>
          <p>Consulte, pague o cancele sus reservas.</p>
        </div>
        <Link className="boton" to="/">
          Nueva reserva
        </Link>
      </div>
      {aviso && <Alerta tipo="exito">{aviso}</Alerta>}
      <div className="pestanas" role="tablist" aria-label="Reservas">
        {(
          [
            ['proximas', `Próximas (${proximas.length})`],
            ['historial', `Historial (${historial.length})`],
          ] as const
        ).map(([clave, texto]) => (
          <button key={clave} type="button" role="tab" aria-selected={vista === clave} onClick={() => setVista(clave)}>
            {texto}
          </button>
        ))}
      </div>
      {cargando && <Cargando />}
      <ErrorApi error={error} />
      {datos && lista.length === 0 && (
        <Vacio>{vista === 'proximas' ? 'No tiene reservas próximas.' : 'Aún no tiene reservas anteriores.'}</Vacio>
      )}
      <div className="rejilla" role="tabpanel">
        {lista.map((r) => {
          const estado = ESTADOS_RESERVA[r.estado];
          const futura = Date.parse(r.inicio) > ahora;
          return (
            <article key={r.id} className="tarjeta" aria-labelledby={`reserva-${r.id}`}>
              <div className="tarjeta__cabecera">
                <h2 id={`reserva-${r.id}`}>{r.canchaNombre}</h2>
                <Insignia tono={estado.tono}>{estado.texto}</Insignia>
              </div>
              <p className="texto-suave tarjeta__subtitulo">
                {r.sedeNombre} · {DEPORTES[r.deporte]}
              </p>
              <dl className="lista-definiciones">
                <dt>Horario</dt>
                <dd>{formatoRango(r.inicio, r.fin)}</dd>
                <dt>Total</dt>
                <dd>{formatoMoneda(r.precioTotal)}</dd>
                {r.estado === 'CANCELADA' && (
                  <>
                    <dt>Motivo</dt>
                    <dd>{r.motivoCancelacion}</dd>
                    <dt>Reembolso</dt>
                    <dd>{r.porcentajeReembolso ?? 0} %</dd>
                  </>
                )}
              </dl>
              {(r.estado === 'PENDIENTE' || (r.estado === 'CONFIRMADA' && futura)) && (
                <div className="fila separado">
                  {r.estado === 'PENDIENTE' && (
                    <Link className="boton boton--pequeno" to={`/reservas/${r.id}/pagar`}>
                      {r.expiraEn ? 'Pagar ahora' : 'Ver pago'}
                    </Link>
                  )}
                  {futura && (
                    <button
                      type="button"
                      className="boton boton--secundario boton--pequeno"
                      onClick={() => setACancelar(r)}
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
      <DialogoCancelar
        reserva={aCancelar}
        alCerrar={() => setACancelar(null)}
        alCancelar={(r) => {
          setACancelar(null);
          setAviso(
            `Reserva cancelada. ${r.porcentajeReembolso ? `Se reembolsará el ${r.porcentajeReembolso} % si estaba pagada.` : ''}`,
          );
          recargar();
        }}
      />
    </>
  );
}
