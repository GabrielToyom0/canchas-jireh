import { useState } from 'react';
import { Cargando, ErrorApi } from './Avisos';
import { Campo } from './Campo';
import { Dialogo } from './Dialogo';
import { useCarga } from '../hooks/useCarga';
import { useEnvio } from '../hooks/useEnvio';
import { reservasApi } from '../api/recursos';
import type { Reserva } from '../types';
import { formatoMoneda, formatoRango } from '../utils/formato';

/** HU-06: antes de cancelar se muestra cuánto se reembolsará según la política de la sede. */
export function DialogoCancelar({
  reserva,
  alCerrar,
  alCancelar,
  motivoPorDefecto = 'Cancelada por el cliente',
}: {
  reserva: Reserva | null;
  alCerrar: () => void;
  alCancelar: (r: Reserva) => void;
  motivoPorDefecto?: string;
}) {
  const [motivo, setMotivo] = useState(motivoPorDefecto);
  const vista = useCarga(() => reservasApi.vistaCancelacion(reserva!.id), [reserva?.id], !!reserva);
  const { enviando, error, ejecutar } = useEnvio();

  async function confirmar() {
    if (!reserva) return;
    const r = await ejecutar(() => reservasApi.cancelar(reserva.id, motivo));
    if (r) alCancelar(r);
  }

  return (
    <Dialogo abierto={!!reserva} titulo="Cancelar reserva" alCerrar={alCerrar}>
      {reserva && (
        <div className="formulario">
          <p>
            {reserva.canchaNombre} · {reserva.sedeNombre}
            <br />
            {formatoRango(reserva.inicio, reserva.fin)}
          </p>
          {vista.cargando && <Cargando texto="Calculando reembolso…" />}
          <ErrorApi error={vista.error ?? error} />
          {vista.datos && (
            <div className={`alerta alerta--${vista.datos.porcentajeReembolso > 0 ? 'info' : 'aviso'}`} role="status">
              {vista.datos.pagada ? (
                <>
                  Faltan {vista.datos.horasAntes} horas para el inicio. Se reembolsará el{' '}
                  <strong>{vista.datos.porcentajeReembolso} %</strong>:{' '}
                  <strong>{formatoMoneda(vista.datos.montoReembolso)}</strong>.
                </>
              ) : (
                'La reserva aún no está pagada, así que no hay monto que reembolsar.'
              )}
            </div>
          )}
          <Campo etiqueta="Motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={200} />
          <div className="fila fila--fin">
            <button type="button" className="boton boton--secundario" onClick={alCerrar}>
              Volver
            </button>
            <button
              type="button"
              className="boton boton--peligro"
              onClick={confirmar}
              disabled={enviando || motivo.trim().length < 3}
            >
              {enviando ? 'Cancelando…' : 'Sí, cancelar reserva'}
            </button>
          </div>
        </div>
      )}
    </Dialogo>
  );
}
