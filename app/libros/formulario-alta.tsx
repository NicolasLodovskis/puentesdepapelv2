"use client";

import { useActionState, useEffect, useRef } from "react";
import { altaLibroAction, type ResultadoAlta } from "./actions";

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

      {resultado?.ok && (
        <p className="ok" role="status">
          Libro dado de alta correctamente.
        </p>
      )}
    </form>
  );
}
