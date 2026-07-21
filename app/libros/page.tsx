import { getDb } from "@/lib/db";
import { listarLibros } from "@/lib/libros";
import { FormularioAlta } from "./formulario-alta";
import { FilaLibro } from "./fila-libro";

// La página lee la base en cada request: no puede prerenderizarse estática.
export const dynamic = "force-dynamic";

export default function LibrosPage() {
  const libros = listarLibros(getDb());

  return (
    <main>
      <h1>Libros</h1>

      <FormularioAlta />

      <section>
        <h2>Listado ({libros.length})</h2>
        {libros.length === 0 ? (
          <p>Todavía no hay libros cargados.</p>
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
