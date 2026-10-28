import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCarga } from './useCarga';
import { sedesApi } from '../api/recursos';

/**
 * Sede con la que trabaja un panel de gestión. El administrador queda fijo en su sede (RN-07);
 * el propietario empieza con la primera y puede cambiarla.
 */
export function useSedeGestionada() {
  const { usuario } = useAuth();
  const sedes = useCarga(() => sedesApi.listar(usuario?.rol === 'PROPIETARIO'), [usuario?.rol]);
  const [elegida, setElegida] = useState('');
  const sedeId = usuario?.rol === 'ADMIN_SEDE' ? (usuario.sedeId ?? '') : elegida || sedes.datos?.[0]?.id || '';
  const sede = sedes.datos?.find((s) => s.id === sedeId);
  return {
    sedeId,
    sede,
    sedes: sedes.datos ?? [],
    cambiarSede: setElegida,
    cargando: sedes.cargando,
    error: sedes.error,
  };
}
