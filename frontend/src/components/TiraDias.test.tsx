import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TiraDias } from './TiraDias';

describe('TiraDias', () => {
  it('ofrece hoy, mañana y cinco días más, con la fecha completa para lectores de pantalla', () => {
    render(<TiraDias hoy="2026-10-23" valor="2026-10-24" alCambiar={() => {}} />);
    expect(screen.getAllByRole('radio')).toHaveLength(7);
    expect(screen.getByRole('radio', { name: 'Mañana 24 de octubre' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Hoy 23 de octubre' })).not.toBeChecked();
  });

  it('avisa el día elegido en la tira', async () => {
    const alCambiar = vi.fn();
    render(<TiraDias hoy="2026-10-23" valor="2026-10-23" alCambiar={alCambiar} />);
    await userEvent.click(screen.getByRole('radio', { name: /^dom 25/ }));
    expect(alCambiar).toHaveBeenCalledWith('2026-10-25');
  });

  it('una fecha fuera de la semana se muestra en "Otra fecha" y no marca ningún día', () => {
    render(<TiraDias hoy="2026-10-23" valor="2026-11-15" alCambiar={() => {}} />);
    expect(screen.getByLabelText('Otra fecha')).toHaveValue('2026-11-15');
    for (const dia of screen.getAllByRole('radio')) expect(dia).not.toBeChecked();
  });

  it('envía la fecha escrita en "Otra fecha" e ignora el campo vacío', () => {
    const alCambiar = vi.fn();
    render(<TiraDias hoy="2026-10-23" valor="2026-10-23" alCambiar={alCambiar} />);
    const otra = screen.getByLabelText('Otra fecha');
    expect(otra).toHaveValue('');
    fireEvent.change(otra, { target: { value: '2026-12-01' } });
    expect(alCambiar).toHaveBeenCalledWith('2026-12-01');
    expect(alCambiar).toHaveBeenCalledTimes(1);
  });
});
