import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { ErrorApi } from '../../components/Avisos';
import { Campo } from '../../components/Campo';
import { useAuth } from '../../context/AuthContext';
import { useEnvio } from '../../hooks/useEnvio';
import { useTitulo } from '../../hooks/useTitulo';
import { INICIO_POR_ROL } from '../../utils/inicio';

export default function LoginPage() {
  useTitulo('Iniciar sesión');
  const { usuario, iniciarSesion } = useAuth();
  const navegar = useNavigate();
  const { state } = useLocation() as { state?: { volverA?: string } };
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const { enviando, error, ejecutar } = useEnvio();

  if (usuario) return <Navigate to={state?.volverA ?? INICIO_POR_ROL[usuario.rol]} replace />;

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const u = await ejecutar(() => iniciarSesion(correo, password));
    if (u) navegar(state?.volverA ?? INICIO_POR_ROL[u.rol], { replace: true });
  }

  return (
    <section className="tarjeta tarjeta--formulario" aria-labelledby="titulo-login">
      <h1 id="titulo-login">Iniciar sesión</h1>
      {state?.volverA && (
        <p className="texto-suave">
          {state.volverA.startsWith('/reservar')
            ? 'Inicie sesión para continuar con su reserva.'
            : 'Inicie sesión para continuar.'}
        </p>
      )}
      <ErrorApi error={error} />
      <form className="formulario" onSubmit={enviar} noValidate>
        <Campo
          etiqueta="Correo electrónico"
          type="email"
          autoComplete="email"
          required
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
        />
        <Campo
          etiqueta="Contraseña"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="boton boton--bloque" disabled={enviando || !correo || !password}>
          {enviando ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
      <p className="texto-suave texto-pequeno separado">
        ¿No tiene cuenta?{' '}
        <Link to="/registro" state={state}>
          Regístrese
        </Link>
      </p>
    </section>
  );
}
