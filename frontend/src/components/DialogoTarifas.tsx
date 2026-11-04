import { useState, type FormEvent } from 'react';
import { Cargando, ErrorApi, Vacio } from './Avisos';
import { Campo, Selector } from './Campo';
import { Dialogo } from './Dialogo';
import { useCarga } from '../hooks/useCarga';
import { useEnvio } from '../hooks/useEnvio';
import { canchasApi } from '../api/recursos';
import type { Cancha, Sede, TipoDia } from '../types';
import { formatoMoneda, hoyGuatemala, TIPOS_DIA } from '../utils/formato';
import { horasConCierre, horasDelDia } from '../utils/horas';

// RF-05 / RN-05: tarifas por franja horaria y tipo de día. Cambiarlas no altera reservas ya hechas.
export function DialogoTarifas({
  cancha,
  sede,
  alCerrar,
}: {
  cancha: Cancha | null;
  sede?: Sede;
  alCerrar: () => void;
}) {
  const tarifas = useCarga(() => canchasApi.tarifas(cancha!.id), [cancha?.id], !!cancha);
  const apertura = sede?.horaApertura ?? '07:00';
  const cierre = sede?.horaCierre ?? '22:00';
  const [form, setForm] = useState({
    tipoDia: 'ENTRE_SEMANA' as TipoDia,
    horaInicio: apertura,
    horaFin: cierre,
    precioHora: '',
    vigenteDesde: hoyGuatemala(),
    vigenteHasta: '',
  });
  const guardado = useEnvio();
  const borrado = useEnvio();

  async function agregar(e: FormEvent) {
    e.preventDefault();
    if (!cancha) return;
    const r = await guardado.ejecutar(() =>
      canchasApi.crearTarifa(cancha.id, {
        ...form,
        precioHora: Number(form.precioHora),
        vigenteHasta: form.vigenteHasta || null,
      }),
    );
    if (r) {
      setForm({ ...form, precioHora: '' });
      tarifas.recargar();
    }
  }

  return (
    <Dialogo abierto={!!cancha} titulo={`Tarifas · ${cancha?.nombre ?? ''}`} alCerrar={alCerrar}>
      {tarifas.cargando && <Cargando />}
      <ErrorApi error={tarifas.error ?? borrado.error} />
      {tarifas.datos?.length === 0 && (
        <Vacio>Sin tarifas: los horarios aparecerán como “Sin tarifa” y no se podrán reservar.</Vacio>
      )}
      {!!tarifas.datos?.length && (
        <table className="tabla separado-abajo">
          <caption className="solo-lectores">Tarifas actuales</caption>
          <thead>
            <tr>
              <th scope="col">Día</th>
              <th scope="col">Franja</th>
              <th scope="col" className="numero">
                Por hora
              </th>
              <th scope="col">Vigencia</th>
              <th scope="col">
                <span className="solo-lectores">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {tarifas.datos.map((t) => (
              <tr key={t.id}>
                <td>{TIPOS_DIA[t.tipoDia]}</td>
                <td>
                  {t.horaInicio}–{t.horaFin}
                </td>
                <td className="numero">{formatoMoneda(t.precioHora)}</td>
                <td className="texto-pequeno">
                  {t.vigenteDesde}
                  {t.vigenteHasta ? ` a ${t.vigenteHasta}` : ' en adelante'}
                </td>
                <td>
                  <button
                    type="button"
                    className="boton boton--fantasma boton--pequeno"
                    disabled={borrado.enviando}
                    aria-label={`Eliminar tarifa ${TIPOS_DIA[t.tipoDia]} ${t.horaInicio}–${t.horaFin}`}
                    onClick={async () => {
                      if (await borrado.ejecutar(() => canchasApi.eliminarTarifa(t.id).then(() => true)))
                        tarifas.recargar();
                    }}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <form className="formulario" onSubmit={agregar} noValidate>
        <h3>Agregar tarifa</h3>
        <ErrorApi error={guardado.error} />
        <Selector
          etiqueta="Tipo de día"
          value={form.tipoDia}
          onChange={(e) => setForm({ ...form, tipoDia: e.target.value as TipoDia })}
        >
          {(Object.keys(TIPOS_DIA) as TipoDia[]).map((t) => (
            <option key={t} value={t}>
              {TIPOS_DIA[t]}
            </option>
          ))}
        </Selector>
        <div className="formulario formulario--columnas">
          <Selector
            etiqueta="Desde"
            value={form.horaInicio}
            onChange={(e) => setForm({ ...form, horaInicio: e.target.value })}
          >
            {horasDelDia(apertura, cierre).map((h) => (
              <option key={h}>{h}</option>
            ))}
          </Selector>
          <Selector
            etiqueta="Hasta"
            value={form.horaFin}
            onChange={(e) => setForm({ ...form, horaFin: e.target.value })}
          >
            {horasConCierre(apertura, cierre)
              .slice(1)
              .map((h) => (
                <option key={h}>{h}</option>
              ))}
          </Selector>
        </div>
        <Campo
          etiqueta="Precio por hora (Q)"
          type="number"
          min={1}
          step="0.01"
          required
          value={form.precioHora}
          onChange={(e) => setForm({ ...form, precioHora: e.target.value })}
        />
        <div className="formulario formulario--columnas">
          <Campo
            etiqueta="Vigente desde"
            type="date"
            required
            value={form.vigenteDesde}
            onChange={(e) => setForm({ ...form, vigenteDesde: e.target.value })}
          />
          <Campo
            etiqueta="Vigente hasta (opcional)"
            type="date"
            value={form.vigenteHasta}
            onChange={(e) => setForm({ ...form, vigenteHasta: e.target.value })}
          />
        </div>
        <div className="fila fila--fin">
          <button type="button" className="boton boton--secundario" onClick={alCerrar}>
            Cerrar
          </button>
          <button className="boton" disabled={guardado.enviando || !form.precioHora}>
            Agregar tarifa
          </button>
        </div>
      </form>
    </Dialogo>
  );
}
