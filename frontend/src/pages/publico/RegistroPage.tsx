import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { ErrorApi } from '../../components/Avisos';
import { errorDeCampo } from '../../utils/errores';
import { Campo } from '../../components/Campo';
import { useAuth } from '../../context/AuthContext';
import { useEnvio } from '../../hooks/useEnvio';
import { useTitulo } from '../../hooks/useTitulo';
import { validarRegistro, type DatosRegistro, type ErroresRegistro } from '../../utils/validacion';

const VACIO: DatosRegistro = { nombre: '', correo: '', telefono: '', password: '', confirmacion: '' };

// HU-01: registro de clientes.
export default function RegistroPage() {
  useTitulo('Crear cuenta');
  const { usuario, registrarse } = useAuth();
  const navegar = useNavigate();
  const { state } = useLocation() as { state?: { volverA?: string } };
  const [datos, setDatos] = useState(VACIO);
  const [errores, setErrores] = useState<ErroresRegistro>({});
  const { enviando, error, ejecutar } = useEnvio();

  if (usuario) return <Navigate to="/" replace />;

  const cambiar = (campo: keyof DatosRegistro) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDatos((d) => ({ ...d, [campo]: e.target.value }));

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const encontrados = validarRegistro(datos);
    setErrores(encontrados);
    if (Object.keys(encontrados).length) return;
    const { nombre, correo, telefono, password } = datos;
    const u = await ejecutar(() => registrarse({ nombre, correo, telefono, password }));
    if (u) navegar(state?.volverA ?? '/', { replace: true });
  }

  const err = (campo: keyof DatosRegistro) => errores[campo] ?? errorDeCampo(error, campo);

  return (
    <section className="tarjeta tarjeta--formulario" aria-labelledby="titulo-registro">
      <h1 id="titulo-registro">Crear cuenta</h1>
      <p className="texto-suave">Regístrese para reservar canchas y pagar en línea.</p>
      <ErrorApi error={error} />
      <form className="formulario" onSubmit={enviar} noValidate>
        <Campo
          etiqueta="Nombre completo"
          autoComplete="name"
          required
          value={datos.nombre}
          onChange={cambiar('nombre')}
          error={err('nombre')}
        />
        <Campo
          etiqueta="Correo electrónico"
          type="email"
          autoComplete="email"
          required
          value={datos.correo}
          onChange={cambiar('correo')}
          error={err('correo')}
        />
        <Campo
          etiqueta="Teléfono"
          type="tel"
          autoComplete="tel"
          required
          value={datos.telefono}
          onChange={cambiar('telefono')}
          error={err('telefono')}
          ayuda="Ejemplo: 5555-1234"
        />
        <Campo
          etiqueta="Contraseña"
          type="password"
          autoComplete="new-password"
          required
          value={datos.password}
          onChange={cambiar('password')}
          error={err('password')}
          ayuda="Mínimo 8 caracteres, con letras y números."
        />
        <Campo
          etiqueta="Confirmar contraseña"
          type="password"
          autoComplete="new-password"
          required
          value={datos.confirmacion}
          onChange={cambiar('confirmacion')}
          error={err('confirmacion')}
        />
        <button className="boton boton--bloque" disabled={enviando}>
          {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
      </form>
      <p className="texto-suave texto-pequeno separado">
        ¿Ya tiene cuenta?{' '}
        <Link to="/ingresar" state={state}>
          Inicie sesión
        </Link>
      </p>
    </section>
  );
}
