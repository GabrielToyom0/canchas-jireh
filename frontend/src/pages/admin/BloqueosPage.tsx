import { useState, type FormEvent } from 'react';
import { Alerta, Cargando, ErrorApi, Vacio } from '../../components/Avisos';
import { errorDeCampo } from '../../utils/errores';
import { Campo, Selector } from '../../components/Campo';
import { SelectorSede } from '../../components/SelectorSede';
import { useCarga } from '../../hooks/useCarga';
import { useEnvio } from '../../hooks/useEnvio';
import { useSedeGestionada } from '../../hooks/useSedeGestionada';
import { useTitulo } from '../../hooks/useTitulo';
import { bloqueosApi, canchasApi } from '../../api/recursos';
import { formatoRango, hoyGuatemala, sumarDias } from '../../utils/formato';
import { horasConCierre, horasDelDia } from '../../utils/horas';

// RF-06 / HU-11: bloquear horarios por mantenimiento u otro motivo.
export default function BloqueosPage() {
  useTitulo('Bloqueos de horario');
  const { sedeId, sede, sedes, cambiarSede } = useSedeGestionada();
  const hoy = hoyGuatemala();
  const canchas = useCarga(() => canchasApi.listar({ sedeId }), [sedeId], !!sedeId);
  const bloqueos = useCarga(
    () => bloqueosApi.listar({ sedeId, desde: hoy, hasta: sumarDias(hoy, 60) }),
    [sedeId],
    !!sedeId,
  );
  const [form, setForm] = useState({ canchaId: '', fecha: hoy, horaInicio: '', horaFin: '', motivo: '' });
  const [aviso, setAviso] = useState<string>();
  const guardado = useEnvio();
  const borrado = useEnvio();

  const horas = sede ? horasDelDia(sede.horaApertura, sede.horaCierre) : [];
  const fines = sede ? horasConCierre(sede.horaApertura, sede.horaCierre).slice(1) : [];
  const valor = {
    ...form,
    canchaId: form.canchaId || canchas.datos?.[0]?.id || '',
    horaInicio: form.horaInicio || horas[0] || '',
    horaFin: form.horaFin || fines[0] || '',
  };

  async function crear(e: FormEvent) {
    e.preventDefault();
    if (await guardado.ejecutar(() => bloqueosApi.crear(valor))) {
      setAviso('Bloqueo creado: ese horario ya no se puede reservar.');
      setForm({ ...form, motivo: '' });
      bloqueos.recargar();
    }
  }

  return (
    <>
      <div className="cabecera-pagina">
        <div>
          <h1>Bloqueos de horario</h1>
          <p>Impida reservas durante mantenimientos o eventos.</p>
        </div>
      </div>
      <div className="tarjeta">
        <SelectorSede sedes={sedes} valor={sedeId} alCambiar={cambiarSede} />
        <hr className="separador" />
        <form className="formulario" onSubmit={crear} noValidate aria-labelledby="titulo-nuevo-bloqueo">
          <h2 id="titulo-nuevo-bloqueo">Nuevo bloqueo</h2>
          {aviso && <Alerta tipo="exito">{aviso}</Alerta>}
          <ErrorApi error={guardado.error} />
          <div className="formulario formulario--columnas">
            <Selector
              etiqueta="Cancha"
              value={valor.canchaId}
              onChange={(e) => setForm({ ...form, canchaId: e.target.value })}
            >
              {canchas.datos?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </Selector>
            <Campo
              etiqueta="Fecha"
              type="date"
              min={hoy}
              value={valor.fecha}
              onChange={(e) => setForm({ ...form, fecha: e.target.value })}
            />
            <Selector
              etiqueta="Desde"
              value={valor.horaInicio}
              onChange={(e) => setForm({ ...form, horaInicio: e.target.value })}
            >
              {horas.map((h) => (
                <option key={h}>{h}</option>
              ))}
            </Selector>
            <Selector
              etiqueta="Hasta"
              value={valor.horaFin}
              onChange={(e) => setForm({ ...form, horaFin: e.target.value })}
            >
              {fines.map((h) => (
                <option key={h}>{h}</option>
              ))}
            </Selector>
          </div>
          <Campo
            etiqueta="Motivo"
            required
            value={form.motivo}
            onChange={(e) => setForm({ ...form, motivo: e.target.value })}
            error={errorDeCampo(guardado.error, 'motivo')}
            ayuda="Ej. mantenimiento de grama, torneo privado"
          />
          <div className="fila fila--fin">
            <button className="boton" disabled={guardado.enviando || !valor.canchaId}>
              Bloquear horario
            </button>
          </div>
        </form>
      </div>

      <section className="separado-grande" aria-labelledby="titulo-bloqueos">
        <h2 id="titulo-bloqueos">Próximos bloqueos</h2>
        <ErrorApi error={bloqueos.error ?? borrado.error} />
        {bloqueos.cargando && <Cargando />}
        {bloqueos.datos?.length === 0 && <Vacio>No hay bloqueos programados.</Vacio>}
        {!!bloqueos.datos?.length && (
          <div className="tabla-contenedor">
            <table className="tabla">
              <caption className="solo-lectores">Bloqueos programados</caption>
              <thead>
                <tr>
                  <th scope="col">Cancha</th>
                  <th scope="col">Horario</th>
                  <th scope="col">Motivo</th>
                  <th scope="col">
                    <span className="solo-lectores">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {bloqueos.datos.map((b) => (
                  <tr key={b.id}>
                    <td>{b.cancha?.nombre}</td>
                    <td>{formatoRango(b.inicio, b.fin)}</td>
                    <td>{b.motivo}</td>
                    <td>
                      <button
                        type="button"
                        className="boton boton--fantasma boton--pequeno"
                        disabled={borrado.enviando}
                        onClick={async () => {
                          if (await borrado.ejecutar(() => bloqueosApi.eliminar(b.id).then(() => true)))
                            bloqueos.recargar();
                        }}
                      >
                        Quitar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
