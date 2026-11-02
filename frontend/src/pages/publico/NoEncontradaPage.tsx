import { Link } from 'react-router';
import { useTitulo } from '../../hooks/useTitulo';

export default function NoEncontradaPage() {
  useTitulo('Página no encontrada');
  return (
    <section className="tarjeta texto-centrado">
      <h1>Página no encontrada</h1>
      <p className="texto-suave">La dirección que buscó no existe o fue movida.</p>
      <Link className="boton" to="/">
        Ir a buscar canchas
      </Link>
    </section>
  );
}
