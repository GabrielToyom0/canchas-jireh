import { useState } from 'react';
import { Alerta, Cargando, ErrorApi, Vacio } from '../../components/Avisos';
import { Campo } from '../../components/Campo';
import { Dialogo } from '../../components/Dialogo';
import { SelectorSede } from '../../components/SelectorSede';
import { useAuth } from '../../context/AuthContext';
import { useCarga } from '../../hooks/useCarga';
import { useEnvio } from '../../hooks/useEnvio';
import { useSedeGestionada } from '../../hooks/useSedeGestionada';
import { useTitulo } from '../../hooks/useTitulo';
import { descargarArchivo } from '../../api/cliente';
import { pagosApi, reservasApi } from '../../api/recursos';
import type { Pago, Reserva } from '../../types';
import { formatoFechaHora, formatoMoneda, formatoRango, METODOS_PAGO } from '../../utils/formato';

// HU-10 / RN-08: transferencias y efectivo requieren la verificación de un administrador.
export default function VerificarPagosPage() {
  useTitulo('Verificar pagos');
  const { usuario } = useAuth();
  const { sedes } = useSedeGestionada();
  const [filtroSede, setFiltroSede] = useState('');
  const sedeId = usuario?.rol === 'ADMIN_SEDE' ? (usuario.sedeId ?? '') : filtroSede;

  const pendientes = useCarga(async () => {
    const pagos = await pagosApi.pendientes(sedeId || undefined);
    const reservas = await Promise.all(pagos.map((p) => reservasApi.obtener(p.reservaId).catch(() => null)));
    return pagos.map((pago, i) => ({ pago, reserva: reservas[i] }));
  }, [sedeId]);

  const [aRechazar, setARechazar] = useState<Pago | null>(null);
  const [motivo, setMotivo] = useState('');
  const [aviso, setAviso] = useState<string>();
  const accion = useEnvio();

  async function verificar(pago: Pago, aprobar: boolean, motivoRechazo?: string) {
    const r = await accion.ejecutar(() => pagosApi.verificar(pago.id, aprobar, motivoRechazo));
    if (r) {
      setAviso(
        aprobar ? 'Pago aprobado: la reserva quedará confirmada y el cliente recibirá un correo.' : 'Pago rechazado.',
      );
      setARechazar(null);
      setMotivo('');
      pendientes.recargar();
    }
  }

  async function verComprobante(pago: Pago) {
    const ventana = window.open('', '_blank');
    try {
      const url = await descargarArchivo(`/pagos/${pago.id}/comprobante`);
      if (ventana) ventana.location.href = url;
    } catch (e) {
      ventana?.close();
      accion.setError(e);
    }
  }

  return (
    <>
      <div className="cabecera-pagina">
        <div>
          <h1>Verificar pagos</h1>
          <p>Transferencias y pagos en efectivo pendientes de confirmar.</p>
        </div>
      </div>
      {usuario?.rol === 'PROPIETARIO' && (
        <div className="tarjeta separado-abajo">
          <SelectorSede sedes={sedes} valor={filtroSede} alCambiar={setFiltroSede} incluirTodas />
        </div>
      )}
      {aviso && <Alerta tipo="exito">{aviso}</Alerta>}
      <ErrorApi error={pendientes.error ?? accion.error} />
      {pendientes.cargando && <Cargando />}
      {pendientes.datos?.length === 0 && <Vacio>No hay pagos pendientes de verificación.</Vacio>}
      <div className="rejilla">
        {pendientes.datos?.map(({ pago, reserva }) => (
          <TarjetaPago
            key={pago.id}
            pago={pago}
            reserva={reserva}
            ocupado={accion.enviando}
            alAprobar={() => verificar(pago, true)}
            alRechazar={() => setARechazar(pago)}
            alVerComprobante={() => verComprobante(pago)}
          />
        ))}
      </div>
      <Dialogo abierto={!!aRechazar} titulo="Rechazar pago" alCerrar={() => setARechazar(null)}>
        <form
          className="formulario"
          onSubmit={(e) => {
            e.preventDefault();
            if (aRechazar) void verificar(aRechazar, false, motivo);
          }}
        >
          <p>El cliente volverá a tener tiempo para pagar con otro método.</p>
          <Campo
            etiqueta="Motivo del rechazo"
            required
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            maxLength={200}
          />
          <div className="fila fila--fin">
            <button type="button" className="boton boton--secundario" onClick={() => setARechazar(null)}>
              Volver
            </button>
            <button className="boton boton--peligro" disabled={accion.enviando || motivo.trim().length < 3}>
              Rechazar pago
            </button>
          </div>
        </form>
      </Dialogo>
    </>
  );
}

function TarjetaPago({
  pago,
  reserva,
  ocupado,
  alAprobar,
  alRechazar,
  alVerComprobante,
}: {
  pago: Pago;
  reserva: Reserva | null;
  ocupado: boolean;
  alAprobar: () => void;
  alRechazar: () => void;
  alVerComprobante: () => void;
}) {
  return (
    <article className="tarjeta" aria-label={`Pago de ${reserva?.usuarioNombre ?? 'cliente'}`}>
      <div className="tarjeta__cabecera">
        <h2>{formatoMoneda(pago.monto)}</h2>
        <span className="insignia insignia--ambar">{METODOS_PAGO[pago.metodo]}</span>
      </div>
      <dl className="lista-definiciones separado-poco">
        <dt>Cliente</dt>
        <dd>{reserva?.usuarioNombre ?? '—'}</dd>
        <dt>Reserva</dt>
        <dd>{reserva ? `${reserva.canchaNombre}, ${formatoRango(reserva.inicio, reserva.fin)}` : '—'}</dd>
        {pago.referenciaBanco && (
          <>
            <dt>Referencia</dt>
            <dd>{pago.referenciaBanco}</dd>
          </>
        )}
        <dt>Registrado</dt>
        <dd>{formatoFechaHora(pago.creadoEn)}</dd>
      </dl>
      <div className="fila separado">
        {pago.comprobanteUrl && (
          <button type="button" className="boton boton--fantasma boton--pequeno" onClick={alVerComprobante}>
            Ver comprobante
          </button>
        )}
        <button type="button" className="boton boton--pequeno" disabled={ocupado} onClick={alAprobar}>
          Aprobar
        </button>
        <button
          type="button"
          className="boton boton--secundario boton--pequeno"
          disabled={ocupado}
          onClick={alRechazar}
        >
          Rechazar
        </button>
      </div>
    </article>
  );
}
