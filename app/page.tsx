import Link from "next/link";

export default function Home() {
  return (
    <main>
      <h1>Puentes de Papel</h1>
      <p>Manejo de Stock.</p>
      <nav className="menu-inicio">
        <Link href="/libros/alta">Alta de libros</Link>
        <Link href="/libros">Libros</Link>
        <Link href="/historial">Historiales</Link>
      </nav>
    </main>
  );
}
