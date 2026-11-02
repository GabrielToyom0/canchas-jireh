import { useState, type FormEvent } from 'react';
import { ErrorApi } from './Avisos';
import { errorDeCampo } from '../utils/errores';
import { Campo } from './Campo';
import { useEnvio } from '../hooks/useEnvio';
import { pagosApi } from '../api/recursos';
import type { Pago } from '../types';
import { formatoMoneda } from '../utils/formato';
import { agruparNumero, formatoExpiracion } from '../utils/tarjeta';

// RN-08: la tarjeta simulada confirma la reserva de inmediato. No se guarda el número completo.
export function FormularioTarjeta({
  reservaId,
  monto,
  alPagar,
}: {
  reservaId: string;
  monto: number;
  alPagar: (p: Pago) => void;
}) {
  const [numero, setNumero] = useState('');
  const [titular, setTitular] = useState('');
  const [expiracion, setExpiracion] = useState('');
  const [cvv, setCvv] = useState('');
  const { enviando, error, ejecutar } = useEnvio();

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const pago = await ejecutar(() => pagosApi.tarjeta({ reservaId, numero, titular, expiracion, cvv }));
    if (pago) alPagar(pago);
  }

  return (
    <form className="formulario" onSubmit={enviar} noValidate aria-label="Pago con tarjeta">
      <ErrorApi error={error} />
      <Campo
        etiqueta="Número de tarjeta"
        inputMode="numeric"
        autoComplete="cc-number"
        required
        value={numero}
        onChange={(e) => setNumero(agruparNumero(e.target.value))}
        error={errorDeCampo(error, 'numero')}
        ayuda="Simulación: use 4242 4242 4242 4242 (aprobada) o 4000 0000 0000 0002 (rechazada)."
      />
      <Campo
        etiqueta="Nombre del titular"
        autoComplete="cc-name"
        required
        value={titular}
        onChange={(e) => setTitular(e.target.value)}
        error={errorDeCampo(error, 'titular')}
      />
      <div className="formulario formulario--columnas">
        <Campo
          etiqueta="Vencimiento (MM/AA)"
          inputMode="numeric"
          autoComplete="cc-exp"
          placeholder="MM/AA"
          required
          value={expiracion}
          onChange={(e) => setExpiracion(formatoExpiracion(e.target.value))}
          error={errorDeCampo(error, 'expiracion')}
        />
        <Campo
          etiqueta="CVV"
          inputMode="numeric"
          autoComplete="cc-csc"
          maxLength={4}
          required
          value={cvv}
          onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
          error={errorDeCampo(error, 'cvv')}
        />
      </div>
      <button className="boton boton--bloque" disabled={enviando}>
        {enviando ? 'Procesando pago…' : `Pagar ${formatoMoneda(monto)}`}
      </button>
    </form>
  );
}
