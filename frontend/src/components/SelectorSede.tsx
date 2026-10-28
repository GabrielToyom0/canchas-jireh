import { useAuth } from '../context/AuthContext';
import type { Sede } from '../types';
import { Selector } from './Campo';

/**
 * Selector de sede para paneles de gestión. El administrador solo ve la suya y no puede cambiarla (RN-07);
 * el propietario puede elegir cualquiera.
 */
export function SelectorSede({
  sedes,
  valor,
  alCambiar,
  incluirTodas = false,
  etiqueta = 'Sede',
}: {
  sedes: Sede[];
  valor: string;
  alCambiar: (sedeId: string) => void;
  incluirTodas?: boolean;
  etiqueta?: string;
}) {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === 'ADMIN_SEDE';
  const visibles = esAdmin ? sedes.filter((s) => s.id === usuario.sedeId) : sedes;

  return (
    <Selector etiqueta={etiqueta} value={valor} onChange={(e) => alCambiar(e.target.value)} disabled={esAdmin}>
      {incluirTodas && <option value="">Todas las sedes</option>}
      {!incluirTodas && !valor && <option value="">Seleccione una sede</option>}
      {visibles.map((s) => (
        <option key={s.id} value={s.id}>
          {s.nombre}
          {s.activa ? '' : ' (inactiva)'}
        </option>
      ))}
    </Selector>
  );
}
