import Link from "next/link";

export default function Home() {
  return (
    <main>
      <h1>Puentes de Papel</h1>
      <p>Manejo de Stock.</p>
      <p>
        <Link href="/libros">Ir a Libros →</Link>
      </p>
    </main>
  );
}
