import Link from "next/link";
import { getDb } from "@/lib/db";
import {
  listarHistorialPrecio,
  listarHistorialStock,
  listarHistorialVenta,
} from "@/lib/historial";

// Lee la base en cada request: no puede prerenderizarse estática.
export const dynamic = "force-dynamic";

function formatearPrecio(precio: number): string {
  return precio.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
  });
}

export default function HistorialPage() {
  const db = getDb();
  const precio = listarHistorialPrecio(db);
  const stock = listarHistorialStock(db);
  const ventas = listarHistorialVenta(db);

  return (
    <main>
      <p>
        <Link href="/" className="boton-volver">
          ← Volver al inicio
        </Link>
      </p>

      <h1>Historiales</h1>

      <section>
        <h2>Precio ({precio.length})</h2>
        {precio.length === 0 ? (
          <p>Sin cambios de precio registrados.</p>
        ) : (
          <table className="tabla-libros">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Título</th>
                <th>Editorial</th>
                <th>Precio anterior</th>
                <th>Precio nuevo</th>
                <th>Origen</th>
              </tr>
            </thead>
            <tbody>
              {precio.map((e) => (
                <tr key={e.id}>
                  <td>{e.fecha}</td>
                  <td>{e.titulo}</td>
                  <td>{e.editorial}</td>
                  <td>{formatearPrecio(e.precio_anterior)}</td>
                  <td>{formatearPrecio(e.precio_nuevo)}</td>
                  <td>{e.origen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h2>Stock ({stock.length})</h2>
        {stock.length === 0 ? (
          <p>Sin cambios de stock registrados.</p>
        ) : (
          <table className="tabla-libros">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Título</th>
                <th>Editorial</th>
                <th>Cantidad anterior</th>
                <th>Cantidad resultante</th>
                <th>Origen</th>
              </tr>
            </thead>
            <tbody>
              {stock.map((e) => (
                <tr key={e.id}>
                  <td>{e.fecha}</td>
                  <td>{e.titulo}</td>
                  <td>{e.editorial}</td>
                  <td>{e.cantidad_anterior}</td>
                  <td>{e.cantidad_resultante}</td>
                  <td>{e.origen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h2>Ventas ({ventas.length})</h2>
        {ventas.length === 0 ? (
          <p>Sin ventas registradas.</p>
        ) : (
          <table className="tabla-libros">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Título</th>
                <th>Editorial</th>
                <th>Precio de venta</th>
              </tr>
            </thead>
            <tbody>
              {ventas.map((e) => (
                <tr key={e.id}>
                  <td>{e.fecha}</td>
                  <td>{e.titulo}</td>
                  <td>{e.editorial}</td>
                  <td>{formatearPrecio(e.precio_venta)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
