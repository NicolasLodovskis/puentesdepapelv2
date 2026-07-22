"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import {
  crearLibro,
  modificarPrecio,
  modificarStock,
  marcarVendido,
  ErrorValidacion,
  ErrorNoEncontrado,
  ErrorStockInsuficiente,
  type NuevoLibro,
  type Libro,
} from "@/lib/libros";

export type ResultadoAlta =
  | { ok: true; libro: Libro }
  | { ok: false; errores: string[] };

export type ResultadoEdicion =
  | { ok: true }
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
    revalidatePath("/libros");
    return { ok: true, libro };
  } catch (e) {
    if (e instanceof ErrorValidacion) {
      return { ok: false, errores: e.errores };
    }
    throw e;
  }
}

/**
 * Server action de edición de precio (RF-02 / RF-14). Adaptador fino sobre
 * `modificarPrecio`. Pensada para usarse con `useActionState`.
 */
export async function editarPrecioAction(
  _prev: ResultadoEdicion | null,
  formData: FormData,
): Promise<ResultadoEdicion> {
  const libroId = aNumero(formData.get("libroId"));
  const precio = aNumero(formData.get("precio"));

  try {
    modificarPrecio(getDb(), libroId, precio);
    revalidatePath("/libros");
    return { ok: true };
  } catch (e) {
    if (e instanceof ErrorValidacion) {
      return { ok: false, errores: e.errores };
    }
    if (e instanceof ErrorNoEncontrado) {
      return { ok: false, errores: [e.message] };
    }
    throw e;
  }
}

/**
 * Server action de edición manual de stock (RF-03 / RF-13). Adaptador fino
 * sobre `modificarStock`. Pensada para usarse con `useActionState`.
 */
export async function editarStockAction(
  _prev: ResultadoEdicion | null,
  formData: FormData,
): Promise<ResultadoEdicion> {
  const libroId = aNumero(formData.get("libroId"));
  const stock = aNumero(formData.get("stock"));

  try {
    modificarStock(getDb(), libroId, stock);
    revalidatePath("/libros");
    return { ok: true };
  } catch (e) {
    if (e instanceof ErrorValidacion) {
      return { ok: false, errores: e.errores };
    }
    if (e instanceof ErrorNoEncontrado) {
      return { ok: false, errores: [e.message] };
    }
    throw e;
  }
}

/**
 * Server action de venta (RF-05 / RF-12 / RF-13). Adaptador fino sobre
 * `marcarVendido`. Pensada para usarse con `useActionState`.
 */
export async function venderAction(
  _prev: ResultadoEdicion | null,
  formData: FormData,
): Promise<ResultadoEdicion> {
  const libroId = aNumero(formData.get("libroId"));

  try {
    marcarVendido(getDb(), libroId);
    revalidatePath("/libros");
    return { ok: true };
  } catch (e) {
    if (e instanceof ErrorStockInsuficiente || e instanceof ErrorNoEncontrado) {
      return { ok: false, errores: [e.message] };
    }
    throw e;
  }
}
