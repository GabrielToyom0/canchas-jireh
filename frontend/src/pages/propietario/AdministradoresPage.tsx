import { useState, type FormEvent } from 'react';
import { Alerta, Cargando, ErrorApi, Insignia, Vacio } from '../../components/Avisos';
import { errorDeCampo } from '../../utils/errores';
import { Campo } from '../../components/Campo';
import { SelectorSede } from '../../components/SelectorSede';
import { useCarga } from '../../hooks/useCarga';
import { useEnvio } from '../../hooks/useEnvio';
import { useTitulo } from '../../hooks/useTitulo';
import { sedesApi, usuariosApi } from '../../api/recursos';

const VACIO = { nombre: '', correo: '', telefono: '', password: '', sedeId: '' };

// Tabla 2: el propietario gestiona a los administradores de sede.
export default function AdministradoresPage() {
  useTitulo('Administradores');
  const sedes = useCarga(() => sedesApi.listar(true), []);
  const admins = useCarga(() => usuariosApi.listar('ADMIN_SEDE'), []);
  const [form, setForm] = useState(VACIO);
  const [aviso, setAviso] = useState<string>();
  const guardado = useEnvio();
  const cambio = useEnvio();
  const nombreSede = (id: string | null) => sedes.datos?.find((s) => s.id === id)?.nombre ?? '—';

  async function crear(e: FormEvent) {
    e.preventDefault();
    const r = await guardado.ejecutar(() =>
      usuariosApi.crearAdmin({ ...form, sedeId: form.sedeId || sedes.datos?.[0]?.id || '' }),
    );
    if (r) {
      setAviso(`Administrador ${r.nombre} creado. Comparta la contraseña de forma segura.`);
      setForm(VACIO);
      admins.recargar();
    }
  }

  const campo = (clave: keyof typeof VACIO) => ({
    value: form[clave],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [clave]: e.target.value }),
    error: errorDeCampo(guardado.error, clave),
  });

  return (
    <>
      <div className="cabecera-pagina">
        <div>
          <h1>Administradores de sede</h1>
          <p>Cada administrador gestiona únicamente la sede asignada.</p>
        </div>
      </div>
      {aviso && <Alerta tipo="exito">{aviso}</Alerta>}
      <div className="tarjeta">
        <form className="formulario" onSubmit={crear} noValidate aria-labelledby="titulo-nuevo-admin">
          <h2 id="titulo-nuevo-admin">Nuevo administrador</h2>
          <ErrorApi error={guardado.error} />
          <div className="formulario formulario--columnas">
            <Campo etiqueta="Nombre" required autoComplete="off" {...campo('nombre')} />
            <Campo etiqueta="Correo" type="email" required autoComplete="off" {...campo('correo')} />
            <Campo etiqueta="Teléfono" type="tel" required {...campo('telefono')} />
            <Campo
              etiqueta="Contraseña inicial"
              type="password"
              required
              autoComplete="new-password"
              ayuda="Mínimo 8 caracteres, con letras y números."
              {...campo('password')}
            />
            <SelectorSede
              sedes={sedes.datos ?? []}
              valor={form.sedeId || sedes.datos?.[0]?.id || ''}
              alCambiar={(sedeId) => setForm({ ...form, sedeId })}
            />
          </div>
          <div className="fila fila--fin">
            <button className="boton" disabled={guardado.enviando || !sedes.datos?.length}>
              Crear administrador
            </button>
          </div>
        </form>
      </div>

      <section className="separado-grande" aria-labelledby="titulo-admins">
        <h2 id="titulo-admins">Administradores registrados</h2>
        <ErrorApi error={admins.error ?? cambio.error} />
        {admins.cargando && <Cargando />}
        {admins.datos?.length === 0 && <Vacio>Aún no hay administradores.</Vacio>}
        {!!admins.datos?.length && (
          <div className="tabla-contenedor">
            <table className="tabla">
              <caption className="solo-lectores">Administradores de sede</caption>
              <thead>
                <tr>
                  <th scope="col">Nombre</th>
                  <th scope="col">Correo</th>
                  <th scope="col">Sede</th>
                  <th scope="col">Estado</th>
                  <th scope="col">
                    <span className="solo-lectores">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {admins.datos.map((a) => (
                  <tr key={a.id}>
                    <td>{a.nombre}</td>
                    <td>{a.correo}</td>
                    <td>{nombreSede(a.sedeId)}</td>
                    <td>
                      <Insignia tono={a.activo ? 'verde' : 'gris'}>{a.activo ? 'Activo' : 'Desactivado'}</Insignia>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="boton boton--fantasma boton--pequeno"
                        disabled={cambio.enviando}
                        onClick={async () => {
                          if (await cambio.ejecutar(() => usuariosApi.actualizar(a.id, { activo: !a.activo })))
                            admins.recargar();
                        }}
                      >
                        {a.activo ? 'Desactivar' : 'Activar'}
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
