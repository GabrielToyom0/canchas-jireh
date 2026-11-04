import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PaseReserva, PasosReserva } from './Reserva';

describe('flujo de reserva', () => {
  it('marca el paso actual y los anteriores como completados', () => {
    render(<PasosReserva actual={2} />);
    const pasos = screen.getAllByRole('listitem');
    expect(pasos[0]).toHaveTextContent('Elegir horario (completado)');
    expect(pasos[1]).toHaveAttribute('aria-current', 'step');
    expect(pasos[2]).not.toHaveAttribute('aria-current');
  });

  it('el pase resume la reserva con su total en quetzales', () => {
    render(
      <PaseReserva
        cancha="Fútbol 5 - A"
        detalle="Fútbol en Jireh Zona 10"
        filas={[['Horario', '08:00 a 10:00']]}
        total={300}
      />,
    );
    const pase = screen.getByRole('region', { name: 'Resumen de la reserva' });
    expect(pase).toHaveTextContent('Fútbol 5 - A');
    expect(pase).toHaveTextContent('08:00 a 10:00');
    expect(pase).toHaveTextContent(/Total\s*Q\s?300\.00/);
  });
});
