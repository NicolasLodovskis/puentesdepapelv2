"use client";

import { useActionState, useEffect, useRef } from "react";
import { altaLibroAction, type ResultadoAlta } from "../actions";

function formatearPrecio(precio: number): string {
  return precio.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
  });
}

export function FormularioAlta() {
  const [resultado, formAction, pendiente] = useActionState<
    ResultadoAlta | null,
    FormData
  >(altaLibroAction, null);

  const formRef = useRef<HTMLFormElement>(null);

  // Limpiar el formulario tras un alta exitosa.
  useEffect(() => {
    if (resultado?.ok) {
      formRef.current?.reset();
    }
  }, [resultado]);

  return (
    <>
      <form ref={formRef} action={formAction} className="form-alta">
        <h2>Nuevo libro</h2>

        <label>
          Título
          <input name="titulo" type="text" required />
        </label>

        <label>
          Editorial
          <input name="editorial" type="text" required />
        </label>

        <label>
          Stock
          <input name="stock" type="number" min={0} step={1} required />
        </label>

        <label>
          Precio
          <input name="precio" type="number" min={0} step="0.01" required />
        </label>

        <label>
          Foto (opcional)
          <input name="foto" type="text" placeholder="ruta o URL de la foto" />
        </label>

        <button type="submit" disabled={pendiente}>
          {pendiente ? "Guardando…" : "Dar de alta"}
        </button>

        {resultado?.ok === false && (
          <ul className="errores" role="alert">
            {resultado.errores.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}
      </form>

      {resultado?.ok && (
        <div className="confirmacion" role="status">
          <p className="confirmacion-titulo">
            ✓ Libro dado de alta correctamente.
          </p>
          <dl className="confirmacion-datos">
            <dt>Título</dt>
            <dd>{resultado.libro.titulo}</dd>
            <dt>Editorial</dt>
            <dd>{resultado.libro.editorial}</dd>
            <dt>Stock</dt>
            <dd>{resultado.libro.stock}</dd>
            <dt>Precio</dt>
            <dd>{formatearPrecio(resultado.libro.precio)}</dd>
            {resultado.libro.foto && (
              <>
                <dt>Foto</dt>
                <dd>{resultado.libro.foto}</dd>
              </>
            )}
          </dl>
        </div>
      )}
    </>
  );
}
