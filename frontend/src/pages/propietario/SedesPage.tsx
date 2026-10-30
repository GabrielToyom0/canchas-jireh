import { useState, type FormEvent } from 'react';
import { Alerta, Cargando, ErrorApi, Insignia, Vacio } from '../../components/Avisos';
import { errorDeCampo } from '../../utils/errores';
import { Campo, Selector } from '../../components/Campo';
import { Dialogo } from '../../components/Dialogo';
import { useCarga } from '../../hooks/useCarga';
import { useEnvio } from '../../hooks/useEnvio';
import { useTitulo } from '../../hooks/useTitulo';
import { sedesApi } from '../../api/recursos';
import type { Sede } from '../../types';

type Formulario = Omit<Sede, 'id' | 'activa'>;
const VACIO: Formulario = {
  nombre: '',
  direccion: '',
  zona: '',
  telefono: '',
  horaApertura: '07:00',
  horaCierre: '22:00',
};
const HORAS = Array.from({ length: 25 }, (_, i) => `${String(i).padStart(2, '0')}:00`).slice(0, 24);

// RF-03 / HU-08: el propietario administra sus sedes.
export default function SedesPage() {
  useTitulo('Sedes');
  const sedes = useCarga(() => sedesApi.listar(true), []);
  const [editando, setEditando] = useState<Sede | 'nueva' | null>(null);
  const [form, setForm] = useState<Formulario>(VACIO);
  const [aviso, setAviso] = useState<string>();
  const guardado = useEnvio();
  const cambio = useEnvio();

  function abrir(s: Sede | 'nueva') {
    guardado.setError(undefined);
    setForm(
      s === 'nueva'
        ? VACIO
        : {
            nombre: s.nombre,
            direccion: s.direccion,
            zona: s.zona,
            telefono: s.telefono,
            horaApertura: s.horaApertura,
            horaCierre: s.horaCierre,
          },
    );
    setEditando(s);
  }

  async function guardar(e: FormEvent) {
    e.preventDefault();
    const r = await guardado.ejecutar(() =>
      editando === 'nueva' ? sedesApi.crear(form) : sedesApi.actualizar((editando as Sede).id, form),
    );
    if (r) {
      setAviso(
        editando === 'nueva' ? `Sede ${r.nombre} creada. Ahora agregue sus canchas y tarifas.` : 'Sede actualizada.',
      );
      setEditando(null);
      sedes.recargar();
    }
  }

  const campo = (clave: keyof Formulario) => ({
    value: form[clave],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm({ ...form, [clave]: e.target.value }),
    error: errorDeCampo(guardado.error, clave),
  });

  return (
    <>
      <div className="cabecera-pagina">
        <div>
          <h1>Sedes</h1>
          <p>Ubicaciones de Canchas Jireh y su horario de atención.</p>
        </div>
        <button type="button" className="boton" onClick={() => abrir('nueva')}>
          Nueva sede
        </button>
      </div>
      {aviso && <Alerta tipo="exito">{aviso}</Alerta>}
      <ErrorApi error={sedes.error ?? cambio.error} />
      {sedes.cargando && <Cargando />}
      {sedes.datos?.length === 0 && <Vacio>Aún no hay sedes registradas.</Vacio>}
      <div className="rejilla">
        {sedes.datos?.map((s) => (
          <article key={s.id} className="tarjeta" aria-labelledby={`sede-${s.id}`}>
            <div className="tarjeta__cabecera">
              <h2 id={`sede-${s.id}`}>{s.nombre}</h2>
              <Insignia tono={s.activa ? 'verde' : 'gris'}>{s.activa ? 'Activa' : 'Inactiva'}</Insignia>
            </div>
            <dl className="lista-definiciones separado-poco">
              <dt>Dirección</dt>
              <dd>{s.direccion}</dd>
              <dt>Zona</dt>
              <dd>{s.zona}</dd>
              <dt>Teléfono</dt>
              <dd>{s.telefono}</dd>
              <dt>Horario</dt>
              <dd>
                {s.horaApertura} a {s.horaCierre}
              </dd>
            </dl>
            <div className="fila separado">
              <button type="button" className="boton boton--secundario boton--pequeno" onClick={() => abrir(s)}>
                Editar
              </button>
              <button
                type="button"
                className="boton boton--fantasma boton--pequeno"
                disabled={cambio.enviando}
                onClick={async () => {
                  if (await cambio.ejecutar(() => sedesApi.actualizar(s.id, { activa: !s.activa }))) sedes.recargar();
                }}
              >
                {s.activa ? 'Desactivar' : 'Activar'}
              </button>
            </div>
          </article>
        ))}
      </div>

      <Dialogo
        abierto={editando !== null}
        titulo={editando === 'nueva' ? 'Nueva sede' : 'Editar sede'}
        alCerrar={() => setEditando(null)}
      >
        <form className="formulario" onSubmit={guardar} noValidate>
          <ErrorApi error={guardado.error} />
          <Campo etiqueta="Nombre" required {...campo('nombre')} />
          <Campo etiqueta="Dirección" required {...campo('direccion')} />
          <div className="formulario formulario--columnas">
            <Campo etiqueta="Zona o municipio" required {...campo('zona')} />
            <Campo etiqueta="Teléfono" type="tel" required {...campo('telefono')} />
          </div>
          <div className="formulario formulario--columnas">
            <Selector etiqueta="Apertura" {...campo('horaApertura')}>
              {HORAS.map((h) => (
                <option key={h}>{h}</option>
              ))}
            </Selector>
            <Selector etiqueta="Cierre" {...campo('horaCierre')}>
              {HORAS.slice(1).map((h) => (
                <option key={h}>{h}</option>
              ))}
            </Selector>
          </div>
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
    </>
  );
}
