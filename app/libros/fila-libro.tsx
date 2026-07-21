"use client";

import { useActionState } from "react";
import {
  editarPrecioAction,
  editarStockAction,
  type ResultadoEdicion,
} from "./actions";
import type { Libro } from "@/lib/libros";

export function FilaLibro({ libro }: { libro: Libro }) {
  const [resStock, accionStock, pendStock] = useActionState<
    ResultadoEdicion | null,
    FormData
  >(editarStockAction, null);
  const [resPrecio, accionPrecio, pendPrecio] = useActionState<
    ResultadoEdicion | null,
    FormData
  >(editarPrecioAction, null);

  return (
    <tr>
      <td>{libro.titulo}</td>
      <td>{libro.editorial}</td>

      <td>
        <form action={accionStock} className="editar-inline">
          <input type="hidden" name="libroId" value={libro.id} />
          {/* `key` fuerza el remonte con el valor nuevo tras revalidar. */}
          <input
            key={`stock-${libro.stock}`}
            name="stock"
            type="number"
            min={0}
            step={1}
            defaultValue={libro.stock}
            aria-label={`Stock de ${libro.titulo}`}
          />
          <button type="submit" disabled={pendStock}>
            {pendStock ? "…" : "Guardar"}
          </button>
        </form>
        {resStock?.ok === false && (
          <span className="error-inline" role="alert">
            {resStock.errores.join(" ")}
          </span>
        )}
      </td>

      <td>
        <form action={accionPrecio} className="editar-inline">
          <input type="hidden" name="libroId" value={libro.id} />
          <input
            key={`precio-${libro.precio}`}
            name="precio"
            type="number"
            min={0}
            step="0.01"
            defaultValue={libro.precio}
            aria-label={`Precio de ${libro.titulo}`}
          />
          <button type="submit" disabled={pendPrecio}>
            {pendPrecio ? "…" : "Guardar"}
          </button>
        </form>
        {resPrecio?.ok === false && (
          <span className="error-inline" role="alert">
            {resPrecio.errores.join(" ")}
          </span>
        )}
      </td>
    </tr>
  );
}
