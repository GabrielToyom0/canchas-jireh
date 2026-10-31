import { useState } from 'react';
import { Alerta, Cargando, ErrorApi, Vacio } from '../../components/Avisos';
import { Campo } from '../../components/Campo';
import { SelectorSede } from '../../components/SelectorSede';
import { useAhora } from '../../hooks/useAhora';
import { useCarga } from '../../hooks/useCarga';
import { useEnvio } from '../../hooks/useEnvio';
import { useSedeGestionada } from '../../hooks/useSedeGestionada';
import { useTitulo } from '../../hooks/useTitulo';
import { bloqueosApi, canchasApi, reservasApi } from '../../api/recursos';
import type { Bloqueo, Reserva } from '../../types';
import { ESTADOS_RESERVA, formatoFechaLocal, formatoHora, formatoMoneda, hoyGuatemala } from '../../utils/formato';
import { horasDelDia } from '../../utils/horas';
import { DialogoCancelar } from '../../components/DialogoCancelar';

const horaLocal = (iso: string) => formatoHora(iso);
const cubre = (inicio: string, fin: string, hora: string) =>
  horaLocal(inicio) <= hora && hora < (horaLocal(fin) === '00:00' ? '24:00' : horaLocal(fin));

// HU-09 / RF-13: ocupación diaria de la sede, con acciones del administrador (RF-11, RN-03).
export default function CalendarioPage() {
  useTitulo('Calendario de la sede');
  const { sedeId, sede, sedes, cambiarSede, error: errorSede } = useSedeGestionada();
  const [fecha, setFecha] = useState(hoyGuatemala());
  const [aCancelar, setACancelar] = useState<Reserva | null>(null);
  const [aviso, setAviso] = useState<string>();
  const accion = useEnvio();

  const datos = useCarga(
    () =>
      Promise.all([
        canchasApi.listar({ sedeId }),
        reservasApi.calendario(sedeId, fecha),
        bloqueosApi.listar({ sedeId, desde: fecha, hasta: fecha }),
      ]),
    [sedeId, fecha],
    !!sedeId,
  );
  const [canchas = [], reservas = [], bloqueos = []] = datos.datos ?? [];
  const horas = sede ? horasDelDia(sede.horaApertura, sede.horaCierre) : [];

  async function ejecutar(fn: () => Promise<Reserva>, mensaje: string) {
    if (await accion.ejecutar(fn)) {
      setAviso(mensaje);
      datos.recargar();
    }
  }

  const activas = reservas.filter((r) => r.estado === 'PENDIENTE' || r.estado === 'CONFIRMADA');
  const ingresos = reservas
    .filter((r) => ['CONFIRMADA', 'COMPLETADA', 'NO_SE_PRESENTO'].includes(r.estado))
    .reduce((t, r) => t + r.precioTotal, 0);

  return (
    <>
      <div className="cabecera-pagina">
        <div>
          <h1>Calendario</h1>
          <p>{formatoFechaLocal(fecha)}</p>
        </div>
      </div>
      <div className="tarjeta">
        <div className="formulario formulario--columnas">
          <SelectorSede sedes={sedes} valor={sedeId} alCambiar={cambiarSede} />
          <Campo
            etiqueta="Fecha"
            type="date"
            value={fecha}
            onChange={(e) => e.target.value && setFecha(e.target.value)}
          />
          <div className="fila">
            <button type="button" className="boton boton--secundario" onClick={() => setFecha(hoyGuatemala())}>
              Hoy
            </button>
          </div>
        </div>
      </div>
      <ErrorApi error={errorSede ?? datos.error ?? accion.error} />
      {aviso && <Alerta tipo="exito">{aviso}</Alerta>}

      <dl className="cifras separado">
        <div className="cifra">
          <dt>Reservas activas</dt>
          <dd>{activas.length}</dd>
        </div>
        <div className="cifra">
          <dt>Pendientes de pago</dt>
          <dd>{reservas.filter((r) => r.estado === 'PENDIENTE').length}</dd>
        </div>
        <div className="cifra">
          <dt>Ingresos del día</dt>
          <dd>{formatoMoneda(ingresos)}</dd>
        </div>
      </dl>

      {datos.cargando && <Cargando />}
      {!datos.cargando && sede && canchas.length === 0 && <Vacio>Esta sede no tiene canchas activas.</Vacio>}
      {!datos.cargando && sede && canchas.length > 0 && (
        <div className="tabla-contenedor">
          <table className="tabla calendario">
            <caption>Reservas y bloqueos por cancha y hora</caption>
            <thead>
              <tr>
                <th scope="col">Hora</th>
                {canchas.map((c) => (
                  <th key={c.id} scope="col">
                    {c.nombre}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {horas.map((hora) => (
                <tr key={hora}>
                  <th scope="row">{hora}</th>
                  {canchas.map((c) => (
                    <td key={c.id}>
                      <Celda
                        hora={hora}
                        reservas={reservas.filter((r) => r.canchaId === c.id && cubre(r.inicio, r.fin, hora))}
                        bloqueos={bloqueos.filter((b) => b.canchaId === c.id && cubre(b.inicio, b.fin, hora))}
                        ocupado={accion.enviando}
                        alConfirmar={(r) => ejecutar(() => reservasApi.confirmar(r.id), 'Reserva confirmada.')}
                        alNoShow={(r) =>
                          ejecutar(() => reservasApi.noSePresento(r.id), 'Reserva marcada como "no se presentó".')
                        }
                        alCancelar={setACancelar}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <DialogoCancelar
        reserva={aCancelar}
        motivoPorDefecto="Cancelada por la sede"
        alCerrar={() => setACancelar(null)}
        alCancelar={() => {
          setACancelar(null);
          setAviso('Reserva cancelada. Al cancelar la sede, el cliente recibe el 100 % de reembolso.');
          datos.recargar();
        }}
      />
    </>
  );
}

function Celda({
  hora,
  reservas,
  bloqueos,
  ocupado,
  alConfirmar,
  alNoShow,
  alCancelar,
}: {
  hora: string;
  reservas: Reserva[];
  bloqueos: Bloqueo[];
  ocupado: boolean;
  alConfirmar: (r: Reserva) => void;
  alNoShow: (r: Reserva) => void;
  alCancelar: (r: Reserva) => void;
}) {
  const ahora = useAhora();
  return (
    <>
      {bloqueos.map((b) => (
        <div key={b.id} className="bloque-calendario bloque-calendario--BLOQUEO">
          <strong>Bloqueado</strong>
          <div>{b.motivo}</div>
        </div>
      ))}
      {reservas.map((r) => {
        const inicia = horaLocal(r.inicio) === hora;
        const yaInicio = Date.parse(r.inicio) <= ahora;
        return (
          <div key={r.id} className={`bloque-calendario bloque-calendario--${r.estado}`}>
            {inicia ? (
              <>
                <strong>{r.usuarioNombre}</strong>
                <div>
                  {horaLocal(r.inicio)}–{horaLocal(r.fin)} · {ESTADOS_RESERVA[r.estado].texto}
                </div>
                <div className="fila bloque-calendario__acciones">
                  {r.estado === 'PENDIENTE' && (
                    <button
                      type="button"
                      className="boton boton--pequeno"
                      disabled={ocupado}
                      onClick={() => alConfirmar(r)}
                    >
                      Confirmar
                    </button>
                  )}
                  {r.estado === 'CONFIRMADA' && yaInicio && (
                    <button
                      type="button"
                      className="boton boton--secundario boton--pequeno"
                      disabled={ocupado}
                      onClick={() => alNoShow(r)}
                    >
                      No se presentó
                    </button>
                  )}
                  {['PENDIENTE', 'CONFIRMADA'].includes(r.estado) && !yaInicio && (
                    <button
                      type="button"
                      className="boton boton--fantasma boton--pequeno"
                      onClick={() => alCancelar(r)}
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </>
            ) : (
              <span className="texto-suave">↳ {r.usuarioNombre} (continúa)</span>
            )}
          </div>
        );
      })}
    </>
  );
}
