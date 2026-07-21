"use server";

import { getDb } from "@/lib/db";
import { crearLibro, ErrorValidacion, type NuevoLibro } from "@/lib/libros";

export type ResultadoAlta =
  | { ok: true; id: number }
  | { ok: false; errores: string[] };

/** Convierte un campo de formulario a número; vacío o ausente → NaN (inválido). */
function aNumero(valor: FormDataEntryValue | null): number {
  if (valor === null) return NaN;
  const s = String(valor).trim();
  return s === "" ? NaN : Number(s);
}

/**
 * Server action de alta de libro (RF-01). Adaptador fino sobre `crearLibro`:
 * parsea el formulario, delega la validación/persistencia y devuelve el
 * resultado para la UI. Pensada para usarse con `useActionState`.
 */
export async function altaLibroAction(
  _prev: ResultadoAlta | null,
  formData: FormData,
): Promise<ResultadoAlta> {
  const input: NuevoLibro = {
    titulo: String(formData.get("titulo") ?? ""),
    editorial: String(formData.get("editorial") ?? ""),
    foto: (formData.get("foto") as string | null) || null,
    stock: aNumero(formData.get("stock")),
    precio: aNumero(formData.get("precio")),
  };

  try {
    const libro = crearLibro(getDb(), input);
    return { ok: true, id: libro.id };
  } catch (e) {
    if (e instanceof ErrorValidacion) {
      return { ok: false, errores: e.errores };
    }
    throw e;
  }
}
