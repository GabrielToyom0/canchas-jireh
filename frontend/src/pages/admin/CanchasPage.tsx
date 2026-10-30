import { useState, type FormEvent } from 'react';
import { Alerta, Cargando, ErrorApi, Insignia, Vacio } from '../../components/Avisos';
import { errorDeCampo } from '../../utils/errores';
import { Campo, Selector } from '../../components/Campo';
import { Dialogo } from '../../components/Dialogo';
import { SelectorSede } from '../../components/SelectorSede';
import { useAuth } from '../../context/AuthContext';
import { useCarga } from '../../hooks/useCarga';
import { useEnvio } from '../../hooks/useEnvio';
import { useSedeGestionada } from '../../hooks/useSedeGestionada';
import { useTitulo } from '../../hooks/useTitulo';
import { canchasApi } from '../../api/recursos';
import type { Cancha, Deporte } from '../../types';
import { DEPORTES } from '../../utils/formato';
import { DialogoTarifas } from '../../components/DialogoTarifas';

type Formulario = { nombre: string; deporte: Deporte; superficie: string; capacidad: string };
const VACIO: Formulario = { nombre: '', deporte: 'FUTBOL', superficie: '', capacidad: '10' };

// RF-04: canchas por sede. RF-05: tarifas (solo el propietario).
export default function CanchasPage() {
  useTitulo('Canchas');
  const { usuario } = useAuth();
  const esPropietario = usuario?.rol === 'PROPIETARIO';
  const { sedeId, sede, sedes, cambiarSede } = useSedeGestionada();
  const canchas = useCarga(() => canchasApi.listar({ sedeId, incluirInactivas: true }), [sedeId], !!sedeId);
  const [editando, setEditando] = useState<Cancha | 'nueva' | null>(null);
  const [tarifasDe, setTarifasDe] = useState<Cancha | null>(null);
  const [form, setForm] = useState<Formulario>(VACIO);
  const [aviso, setAviso] = useState<string>();
  const guardado = useEnvio();
  const cambioEstado = useEnvio();

  function abrir(c: Cancha | 'nueva') {
    guardado.setError(undefined);
    setForm(
      c === 'nueva'
        ? VACIO
        : { nombre: c.nombre, deporte: c.deporte, superficie: c.superficie, capacidad: String(c.capacidad) },
    );
    setEditando(c);
  }

  async function guardar(e: FormEvent) {
    e.preventDefault();
    const datos = { ...form, capacidad: Number(form.capacidad) };
    const r = await guardado.ejecutar(() =>
      editando === 'nueva'
        ? canchasApi.crear({ ...datos, sedeId })
        : canchasApi.actualizar((editando as Cancha).id, datos),
    );
    if (r) {
      setAviso(editando === 'nueva' ? 'Cancha creada.' : 'Cancha actualizada.');
      setEditando(null);
      canchas.recargar();
    }
  }

  async function alternar(c: Cancha) {
    if (await cambioEstado.ejecutar(() => canchasApi.actualizar(c.id, { activa: !c.activa }))) {
      setAviso(c.activa ? `${c.nombre} desactivada: ya no aparece en las búsquedas.` : `${c.nombre} activada.`);
      canchas.recargar();
    }
  }

  return (
    <>
      <div className="cabecera-pagina">
        <div>
          <h1>Canchas</h1>
          <p>{sede ? `${sede.nombre} · ${sede.horaApertura} a ${sede.horaCierre}` : 'Seleccione una sede'}</p>
        </div>
        <button type="button" className="boton" onClick={() => abrir('nueva')} disabled={!sedeId}>
          Nueva cancha
        </button>
      </div>
      {esPropietario && (
        <div className="tarjeta separado-abajo">
          <SelectorSede sedes={sedes} valor={sedeId} alCambiar={cambiarSede} />
        </div>
      )}
      {aviso && <Alerta tipo="exito">{aviso}</Alerta>}
      <ErrorApi error={canchas.error ?? cambioEstado.error} />
      {canchas.cargando && <Cargando />}
      {canchas.datos?.length === 0 && <Vacio>Esta sede todavía no tiene canchas.</Vacio>}
      {!!canchas.datos?.length && (
        <div className="tabla-contenedor">
          <table className="tabla">
            <caption className="solo-lectores">Canchas de la sede</caption>
            <thead>
              <tr>
                <th scope="col">Cancha</th>
                <th scope="col">Deporte</th>
                <th scope="col">Superficie</th>
                <th scope="col" className="numero">
                  Capacidad
                </th>
                <th scope="col">Estado</th>
                <th scope="col">
                  <span className="solo-lectores">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {canchas.datos.map((c) => (
                <tr key={c.id}>
                  <td>{c.nombre}</td>
                  <td>{DEPORTES[c.deporte]}</td>
                  <td>{c.superficie}</td>
                  <td className="numero">{c.capacidad}</td>
                  <td>
                    <Insignia tono={c.activa ? 'verde' : 'gris'}>{c.activa ? 'Activa' : 'Inactiva'}</Insignia>
                  </td>
                  <td>
                    <div className="fila fila--compacta">
                      <button type="button" className="boton boton--fantasma boton--pequeno" onClick={() => abrir(c)}>
                        Editar
                      </button>
                      {esPropietario && (
                        <button
                          type="button"
                          className="boton boton--fantasma boton--pequeno"
                          onClick={() => setTarifasDe(c)}
                        >
                          Tarifas
                        </button>
                      )}
                      <button
                        type="button"
                        className="boton boton--fantasma boton--pequeno"
                        disabled={cambioEstado.enviando}
                        onClick={() => alternar(c)}
                      >
                        {c.activa ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialogo
        abierto={editando !== null}
        titulo={editando === 'nueva' ? 'Nueva cancha' : 'Editar cancha'}
        alCerrar={() => setEditando(null)}
      >
        <form className="formulario" onSubmit={guardar} noValidate>
          <ErrorApi error={guardado.error} />
          <Campo
            etiqueta="Nombre"
            required
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            error={errorDeCampo(guardado.error, 'nombre')}
          />
          <Selector
            etiqueta="Deporte"
            value={form.deporte}
            onChange={(e) => setForm({ ...form, deporte: e.target.value as Deporte })}
          >
            {(Object.keys(DEPORTES) as Deporte[]).map((d) => (
              <option key={d} value={d}>
                {DEPORTES[d]}
              </option>
            ))}
          </Selector>
          <Campo
            etiqueta="Superficie"
            required
            value={form.superficie}
            onChange={(e) => setForm({ ...form, superficie: e.target.value })}
            error={errorDeCampo(guardado.error, 'superficie')}
            ayuda="Ej. grama sintética, duela, arena"
          />
          <Campo
            etiqueta="Capacidad (jugadores)"
            type="number"
            min={1}
            max={100}
            required
            value={form.capacidad}
            onChange={(e) => setForm({ ...form, capacidad: e.target.value })}
            error={errorDeCampo(guardado.error, 'capacidad')}
          />
          <div className="fila fila--fin">
            <button type="button" className="boton boton--secundario" onClick={() => setEditando(null)}>
              Cancelar
            </button>
            <button className="boton" disabled={guardado.enviando}>
              {guardado.enviando ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </Dialogo>
      <DialogoTarifas cancha={tarifasDe} sede={sede} alCerrar={() => setTarifasDe(null)} />
    </>
  );
}
