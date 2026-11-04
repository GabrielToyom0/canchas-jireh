import type { UsuarioToken } from '../models/usuario.model.js';
import { reporteRepository } from '../repositories/reporte.repository.js';
import { aCentavos, deCentavos } from '../utils/dinero.js';
import { diasEntre, HORA_MS, minutosDeHora, rangoDelDia } from '../utils/fechas.js';
import { sedeDeConsulta } from '../utils/permisos.js';

/** Estados en los que la cancha estuvo efectivamente ocupada. */
const OCUPAN = ['CONFIRMADA', 'COMPLETADA', 'NO_SE_PRESENTO'];

interface Rango {
  desde: string;
  hasta: string;
  sedeId?: string;
}

// OE5 / HU-12: reportes por sede. El administrador solo ve la suya (RN-07).
export const reporteService = {
  /** Horas ocupadas frente a las horas que la sede ofrece en el rango. */
  async ocupacion(usuario: UsuarioToken, filtros: Rango) {
    const dias = diasEntre(filtros.desde, filtros.hasta);
    const sedes = await reporteRepository.sedesConCanchasActivas(sedeDeConsulta(usuario, filtros.sedeId));
    const reservas = await reporteRepository.reservasQueInician(
      sedes.map((s) => s.id),
      rangoDelDia(filtros.desde).desde,
      rangoDelDia(filtros.hasta).hasta,
    );

    return {
      desde: filtros.desde,
      hasta: filtros.hasta,
      sedes: sedes.map((sede) => {
        const propias = reservas.filter((r) => r.sedeId === sede.id);
        const horasOcupadas = propias
          .filter((r) => OCUPAN.includes(r.estado))
          .reduce((t, r) => t + (r.fin.getTime() - r.inicio.getTime()) / HORA_MS, 0);
        const horasPorDia = (minutosDeHora(sede.horaCierre) - minutosDeHora(sede.horaApertura)) / 60;
        const horasDisponibles = horasPorDia * sede.canchas.length * dias;
        const reservasPorEstado: Record<string, number> = {};
        for (const r of propias) reservasPorEstado[r.estado] = (reservasPorEstado[r.estado] ?? 0) + 1;
        return {
          sedeId: sede.id,
          sedeNombre: sede.nombre,
          canchas: sede.canchas.length,
          horasDisponibles,
          horasOcupadas,
          porcentajeOcupacion: horasDisponibles ? Math.round((horasOcupadas / horasDisponibles) * 1000) / 10 : 0,
          reservasPorEstado,
        };
      }),
    };
  },

  /** Ingresos por sede: cobrado, reembolsado y neto, con desglose por método de pago. */
  async ingresos(usuario: UsuarioToken, filtros: Rango) {
    const sedeId = sedeDeConsulta(usuario, filtros.sedeId);
    const desde = rangoDelDia(filtros.desde).desde;
    const hasta = rangoDelDia(filtros.hasta).hasta;
    const [pagos, reembolsos] = await Promise.all([
      reporteRepository.pagosCobrados(sedeId, desde, hasta),
      reporteRepository.reembolsos(sedeId, desde, hasta),
    ]);

    const porSede = new Map<
      string,
      { cobrado: number; reembolsado: number; pagos: number; porMetodo: Record<string, number> }
    >();
    const fila = (id: string) => {
      if (!porSede.has(id)) porSede.set(id, { cobrado: 0, reembolsado: 0, pagos: 0, porMetodo: {} });
      return porSede.get(id)!;
    };
    for (const p of pagos) {
      const f = fila(p.reserva.sedeId);
      f.cobrado += aCentavos(p.monto);
      f.pagos += 1;
      f.porMetodo[p.metodo] = (f.porMetodo[p.metodo] ?? 0) + aCentavos(p.monto);
    }
    for (const r of reembolsos) fila(r.pago.reserva.sedeId).reembolsado += aCentavos(r.monto);

    return {
      desde: filtros.desde,
      hasta: filtros.hasta,
      sedes: [...porSede.entries()].map(([id, f]) => ({
        sedeId: id,
        pagos: f.pagos,
        cobrado: deCentavos(f.cobrado),
        reembolsado: deCentavos(f.reembolsado),
        neto: deCentavos(f.cobrado - f.reembolsado),
        porMetodo: Object.fromEntries(Object.entries(f.porMetodo).map(([m, c]) => [m, deCentavos(c)])),
      })),
    };
  },
};
