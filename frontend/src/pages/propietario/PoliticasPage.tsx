import { useState } from 'react';
import { Alerta, Cargando, ErrorApi } from '../../components/Avisos';
import { SelectorSede } from '../../components/SelectorSede';
import { useCarga } from '../../hooks/useCarga';
import { useEnvio } from '../../hooks/useEnvio';
import { useSedeGestionada } from '../../hooks/useSedeGestionada';
import { useTitulo } from '../../hooks/useTitulo';
import { politicasApi } from '../../api/recursos';
import type { ReglaReembolso } from '../../types';
import { describirPolitica } from '../../utils/calculos';

// RN-06: política de cancelación configurable por sede.
export default function PoliticasPage() {
  useTitulo('Políticas de cancelación');
  const { sedeId, sedes, cambiarSede } = useSedeGestionada();
  const politica = useCarga(() => politicasApi.obtener(sedeId), [sedeId], !!sedeId);

  return (
    <>
      <div className="cabecera-pagina">
        <div>
          <h1>Políticas de cancelación</h1>
          <p>Porcentaje de reembolso según las horas de anticipación con que se cancela.</p>
        </div>
      </div>
      <div className="tarjeta">
        <SelectorSede sedes={sedes} valor={sedeId} alCambiar={cambiarSede} />
        <hr className="separador" />
        {politica.cargando && <Cargando />}
        <ErrorApi error={politica.error} />
        {/* key: al cambiar de sede el editor se reinicia con las reglas de esa sede. */}
        {politica.datos && !politica.cargando && (
          <EditorPolitica key={sedeId} sedeId={sedeId} reglasIniciales={politica.datos.reglas} />
        )}
      </div>
    </>
  );
}

function EditorPolitica({ sedeId, reglasIniciales }: { sedeId: string; reglasIniciales: ReglaReembolso[] }) {
  const [reglas, setReglas] = useState(() => [...reglasIniciales].sort((a, b) => b.horasAntes - a.horasAntes));
  const [aviso, setAviso] = useState<string>();
  const guardado = useEnvio();

  const cambiar = (i: number, campo: keyof ReglaReembolso, valor: string) =>
    setReglas((rs) => rs.map((r, j) => (j === i ? { ...r, [campo]: Number(valor) } : r)));

  async function guardar() {
    const r = await guardado.ejecutar(() => politicasApi.guardar(sedeId, reglas));
    if (r) {
      setAviso('Política guardada. Se aplica a las cancelaciones desde este momento.');
      setReglas(r.reglas);
    }
  }

  return (
    <>
      {aviso && <Alerta tipo="exito">{aviso}</Alerta>}
      <ErrorApi error={guardado.error} />
      <div className="tabla-contenedor">
        <table className="tabla">
          <caption className="solo-lectores">Reglas de reembolso</caption>
          <thead>
            <tr>
              <th scope="col">Desde (horas antes)</th>
              <th scope="col">Reembolso (%)</th>
              <th scope="col">
                <span className="solo-lectores">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {reglas.map((r, i) => (
              <tr key={i}>
                <td>
                  <label className="solo-lectores" htmlFor={`horas-${i}`}>
                    Horas de anticipación, regla {i + 1}
                  </label>
                  <input
                    id={`horas-${i}`}
                    className="entrada-tabla"
                    type="number"
                    min={0}
                    max={720}
                    value={r.horasAntes}
                    onChange={(e) => cambiar(i, 'horasAntes', e.target.value)}
                  />
                </td>
                <td>
                  <label className="solo-lectores" htmlFor={`porcentaje-${i}`}>
                    Porcentaje de reembolso, regla {i + 1}
                  </label>
                  <input
                    id={`porcentaje-${i}`}
                    className="entrada-tabla"
                    type="number"
                    min={0}
                    max={100}
                    value={r.porcentajeReembolso}
                    onChange={(e) => cambiar(i, 'porcentajeReembolso', e.target.value)}
                  />
                </td>
                <td>
                  <button
                    type="button"
                    className="boton boton--fantasma boton--pequeno"
                    disabled={reglas.length <= 1}
                    onClick={() => setReglas((rs) => rs.filter((_, j) => j !== i))}
                  >
                    Quitar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="fila fila--entre separado">
        <button
          type="button"
          className="boton boton--secundario"
          onClick={() => setReglas((rs) => [...rs, { horasAntes: 12, porcentajeReembolso: 25 }])}
        >
          Agregar regla
        </button>
        <button type="button" className="boton" onClick={guardar} disabled={guardado.enviando}>
          Guardar política
        </button>
      </div>
      <section aria-label="Vista previa para el cliente" className="separado">
        <h2 className="titulo-pequeno">Así la verá el cliente</h2>
        <ul>
          {describirPolitica(reglas).map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <p className="texto-suave texto-pequeno">
          Debe existir una regla para 0 horas (cancelaciones de último momento).
        </p>
      </section>
    </>
  );
}
