import Link from "next/link";
import { getDb } from "@/lib/db";
import { buscarLibros } from "@/lib/libros";
import { FilaLibro } from "./fila-libro";

// La página lee la base en cada request: no puede prerenderizarse estática.
export const dynamic = "force-dynamic";

export default async function LibrosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const consulta = (q ?? "").trim();
  // Consulta vacía → todos los libros (ordenados alfabéticamente).
  const libros = buscarLibros(getDb(), consulta);

  return (
    <main>
      <p>
        <Link href="/" className="boton-volver">
          ← Volver al inicio
        </Link>
      </p>

      <h1>Libros</h1>

      <form action="/libros" method="get" className="barra-busqueda">
        <input
          name="q"
          type="search"
          placeholder="Buscar por título o editorial…"
          defaultValue={consulta}
          aria-label="Buscar por título o editorial"
        />
        <button type="submit">Buscar</button>
      </form>

      <section>
        <h2>
          {consulta === ""
            ? `Todos los libros (${libros.length})`
            : `Resultados (${libros.length})`}
        </h2>

        {libros.length === 0 ? (
          <p>
            {consulta === ""
              ? "Todavía no hay libros cargados."
              : `No se encontraron libros para «${consulta}».`}
          </p>
        ) : (
          <table className="tabla-libros">
            <thead>
              <tr>
                <th>Título</th>
                <th>Editorial</th>
                <th>Stock</th>
                <th>Precio</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {libros.map((libro) => (
                <FilaLibro key={libro.id} libro={libro} />
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
