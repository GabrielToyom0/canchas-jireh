import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router';
import { Alerta, Cargando, ErrorApi } from '../../components/Avisos';
import { errorDeCampo } from '../../utils/errores';
import { Campo, Segmentado } from '../../components/Campo';
import { useCarga } from '../../hooks/useCarga';
import { formatoMinutos, useCuentaRegresiva } from '../../hooks/useCuentaRegresiva';
import { useEnvio } from '../../hooks/useEnvio';
import { useTitulo } from '../../hooks/useTitulo';
import { pagosApi, reservasApi } from '../../api/recursos';
import type { MetodoPago } from '../../types';
import { DEPORTES, ESTADOS_RESERVA, formatoRango } from '../../utils/formato';
import { FormularioTarjeta } from '../../components/FormularioTarjeta';
import { PaseReserva, PasosReserva } from '../../components/Reserva';

type Resultado = { tipo: 'confirmada' } | { tipo: 'verificacion'; metodo: MetodoPago };

const MAX_COMPROBANTE = 5 * 1024 * 1024;

// HU-04: pagar en línea (tarjeta simulada) o subir un comprobante de transferencia.
export default function PagoPage() {
  useTitulo('Pagar reserva');
  const { id = '' } = useParams();
  const reserva = useCarga(() => reservasApi.obtener(id), [id]);
  const pagos = useCarga(() => pagosApi.deReserva(id), [id]);
  const [metodo, setMetodo] = useState<MetodoPago>('TARJETA_SIMULADA');
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const segundos = useCuentaRegresiva(reserva.datos?.estado === 'PENDIENTE' ? reserva.datos.expiraEn : null);

  if (reserva.cargando || pagos.cargando) return <Cargando />;
  if (reserva.error) return <ErrorApi error={reserva.error} />;
  const r = reserva.datos!;
  const pagoEnVerificacion = pagos.datos?.find((p) => p.estado === 'PENDIENTE');

  const resumen = (
    <PaseReserva
      cancha={r.canchaNombre}
      detalle={`${DEPORTES[r.deporte]} en ${r.sedeNombre}`}
      filas={[['Horario', formatoRango(r.inicio, r.fin)]]}
      total={r.precioTotal}
    />
  );

  if (resultado) {
    return (
      <div className="reserva">
        <h1>{resultado.tipo === 'confirmada' ? '¡Pago aprobado!' : 'Pago registrado'}</h1>
        {resumen}
        <section className="tarjeta">
          {/* El pago con tarjeta y la confirmación de la reserva se guardan en la misma transacción. */}
          {resultado.tipo === 'confirmada' ? (
            <Alerta tipo="exito">Su reserva está confirmada. Le enviamos un correo de confirmación.</Alerta>
          ) : (
            <Alerta tipo="info">
              {resultado.metodo === 'TRANSFERENCIA'
                ? 'Recibimos su comprobante. Un administrador lo verificará y le avisaremos por correo cuando la reserva quede confirmada.'
                : 'Pague en la sede antes de su horario. El administrador confirmará la reserva al recibir el efectivo.'}{' '}
              Mientras tanto, su horario queda apartado.
            </Alerta>
          )}
          <Link className="boton" to="/mis-reservas">
            Ver mis reservas
          </Link>
        </section>
      </div>
    );
  }

  if (r.estado !== 'PENDIENTE' || pagoEnVerificacion) {
    return (
      <div className="reserva">
        <h1>Pago de reserva</h1>
        {resumen}
        <section className="tarjeta">
          <Alerta tipo={r.estado === 'CONFIRMADA' ? 'exito' : 'info'}>
            {pagoEnVerificacion
              ? 'Esta reserva ya tiene un pago en verificación.'
              : `Esta reserva está en estado: ${ESTADOS_RESERVA[r.estado].texto}.`}
          </Alerta>
          <Link to="/mis-reservas">Volver a mis reservas</Link>
        </section>
      </div>
    );
  }

  return (
    <div className="reserva">
      <h1 id="titulo-pago">Pagar reserva</h1>
      <PasosReserva actual={3} />
      {resumen}
      <section className="tarjeta" aria-labelledby="titulo-pago">
        {segundos !== null && (
          <Alerta tipo={segundos < 180 ? 'aviso' : 'info'}>
            {segundos > 0 ? (
              <>
                Tiene <strong aria-live="off">{formatoMinutos(segundos)}</strong> minutos para pagar antes de que se
                libere el horario.
              </>
            ) : (
              'El tiempo para pagar terminó. Busque el horario nuevamente.'
            )}
          </Alerta>
        )}
        <Segmentado<MetodoPago>
          leyenda="Método de pago"
          nombre="metodo"
          valor={metodo}
          alCambiar={setMetodo}
          opciones={[
            { valor: 'TARJETA_SIMULADA', texto: 'Tarjeta' },
            { valor: 'TRANSFERENCIA', texto: 'Transferencia' },
            { valor: 'EFECTIVO', texto: 'Efectivo en sede' },
          ]}
        />
        <div className="separado">
          {metodo === 'TARJETA_SIMULADA' && (
            <FormularioTarjeta
              reservaId={r.id}
              monto={r.precioTotal}
              alPagar={() => setResultado({ tipo: 'confirmada' })}
            />
          )}
          {metodo === 'TRANSFERENCIA' && (
            <FormularioTransferencia
              reservaId={r.id}
              alPagar={() => setResultado({ tipo: 'verificacion', metodo: 'TRANSFERENCIA' })}
            />
          )}
          {metodo === 'EFECTIVO' && (
            <FormularioEfectivo
              reservaId={r.id}
              alPagar={() => setResultado({ tipo: 'verificacion', metodo: 'EFECTIVO' })}
            />
          )}
        </div>
      </section>
    </div>
  );
}

function FormularioTransferencia({ reservaId, alPagar }: { reservaId: string; alPagar: () => void }) {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [referencia, setReferencia] = useState('');
  const [errorArchivo, setErrorArchivo] = useState<string>();
  const { enviando, error, ejecutar } = useEnvio();

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!archivo) return setErrorArchivo('Adjunte el comprobante');
    const datos = new FormData();
    datos.append('reservaId', reservaId);
    datos.append('referenciaBanco', referencia);
    datos.append('comprobante', archivo);
    if (await ejecutar(() => pagosApi.transferencia(datos))) alPagar();
  }

  return (
    <form className="formulario" onSubmit={enviar} noValidate aria-label="Pago por transferencia">
      <Alerta tipo="info">
        Transfiera el total a{' '}
        <strong>Banco Industrial, cuenta monetaria 123-456789-0, a nombre de Canchas Jireh</strong> y suba el
        comprobante.
      </Alerta>
      <ErrorApi error={error} />
      <Campo
        etiqueta="Número de referencia de la transferencia"
        required
        value={referencia}
        onChange={(e) => setReferencia(e.target.value)}
        error={errorDeCampo(error, 'referenciaBanco')}
      />
      <Campo
        etiqueta="Comprobante (imagen o PDF, máximo 5 MB)"
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        required
        error={errorArchivo}
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          setErrorArchivo(f && f.size > MAX_COMPROBANTE ? 'El archivo supera 5 MB' : undefined);
          setArchivo(f && f.size <= MAX_COMPROBANTE ? f : null);
        }}
      />
      <button className="boton boton--bloque" disabled={enviando}>
        {enviando ? 'Enviando…' : 'Enviar comprobante'}
      </button>
    </form>
  );
}

function FormularioEfectivo({ reservaId, alPagar }: { reservaId: string; alPagar: () => void }) {
  const { enviando, error, ejecutar } = useEnvio();
  return (
    <div className="formulario">
      <Alerta tipo="info">
        Pagará en la recepción de la sede. El administrador confirmará la reserva al recibir el dinero.
      </Alerta>
      <ErrorApi error={error} />
      <button
        type="button"
        className="boton boton--bloque"
        disabled={enviando}
        onClick={async () => {
          if (await ejecutar(() => pagosApi.efectivo(reservaId))) alPagar();
        }}
      >
        {enviando ? 'Registrando…' : 'Pagaré en efectivo en la sede'}
      </button>
    </div>
  );
}
