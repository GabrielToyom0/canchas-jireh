import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/cliente';
import { ErrorApi } from './Avisos';
import { Campo, Segmentado } from './Campo';

describe('componentes de formulario accesibles', () => {
  it('Campo asocia etiqueta, ayuda y error al input', () => {
    render(<Campo etiqueta="Correo" ayuda="Su correo personal" error="Correo inválido" />);
    const input = screen.getByLabelText('Correo');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Su correo personal Correo inválido');
  });

  it('Segmentado usa radios nativos navegables con teclado', async () => {
    const alCambiar = vi.fn();
    render(
      <Segmentado
        leyenda="Deporte"
        nombre="d"
        valor="A"
        alCambiar={alCambiar}
        opciones={[
          { valor: 'A', texto: 'Fútbol' },
          { valor: 'B', texto: 'Vóley' },
        ]}
      />,
    );
    expect(screen.getByRole('group', { name: 'Deporte' })).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText('Vóley'));
    expect(alCambiar).toHaveBeenCalledWith('B');
  });

  it('ErrorApi anuncia el error y lista los campos inválidos', () => {
    render(
      <ErrorApi
        error={new ApiError(400, 'VALIDACION', 'Datos inválidos', [{ campo: 'correo', mensaje: 'Correo inválido' }])}
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Datos inválidos');
    expect(screen.getByRole('alert')).toHaveTextContent('Correo inválido');
  });
});
