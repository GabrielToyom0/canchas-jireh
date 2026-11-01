import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Disponibilidad } from '../types';
import { GrillaDisponibilidad } from './GrillaDisponibilidad';

const disponibilidad: Disponibilidad = {
  fecha: '2026-10-24',
  sede: { id: 's', nombre: 'Jireh Zona 10', horaApertura: '07:00', horaCierre: '10:00' },
  canchas: [
    {
      id: 'c1',
      nombre: 'Fútbol 5 - A',
      deporte: 'FUTBOL',
      superficie: 'Grama',
      capacidad: 10,
      horarios: [
        { hora: '07:00', inicio: '', fin: '', estado: 'PASADO', precio: 150 },
        { hora: '08:00', inicio: '', fin: '', estado: 'DISPONIBLE', precio: 150 },
        { hora: '09:00', inicio: '', fin: '', estado: 'OCUPADO', precio: 150 },
      ],
    },
  ],
};

describe('GrillaDisponibilidad (RF-07)', () => {
  it('solo los horarios disponibles son botones, con nombre accesible', async () => {
    const alElegir = vi.fn();
    render(<GrillaDisponibilidad disponibilidad={disponibilidad} alElegir={alElegir} />);
    const botones = screen.getAllByRole('button');
    expect(botones).toHaveLength(1);
    expect(botones[0]).toHaveAccessibleName(/Reservar Fútbol 5 - A a las 08:00/);
    await userEvent.click(botones[0]);
    expect(alElegir).toHaveBeenCalledWith('c1', expect.objectContaining({ hora: '08:00' }));
  });

  it('el estado no depende solo del color: también se dice con texto', () => {
    render(<GrillaDisponibilidad disponibilidad={disponibilidad} alElegir={() => {}} />);
    expect(screen.getByText('Ocupado')).toBeInTheDocument();
    expect(screen.getByText('Ya pasó')).toBeInTheDocument();
    expect(screen.getByText('1 libre')).toBeInTheDocument();
  });

  it('en modo de solo lectura no permite reservar', () => {
    render(<GrillaDisponibilidad disponibilidad={disponibilidad} alElegir={() => {}} soloLectura />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});
