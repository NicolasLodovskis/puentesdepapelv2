import { getDb } from "@/lib/db";
import { listarLibros } from "@/lib/libros";
import { FormularioAlta } from "./formulario-alta";

// La página lee la base en cada request: no puede prerenderizarse estática.
export const dynamic = "force-dynamic";

function formatearPrecio(precio: number): string {
  return precio.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
  });
}

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
              </tr>
            </thead>
            <tbody>
              {libros.map((libro) => (
                <tr key={libro.id}>
                  <td>{libro.titulo}</td>
                  <td>{libro.editorial}</td>
                  <td>{libro.stock}</td>
                  <td>{formatearPrecio(libro.precio)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
