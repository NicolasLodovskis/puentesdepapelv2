import type Database from "better-sqlite3";

/**
 * Lectura de los historiales (RF-15). Cada entrada se devuelve junto con el
 * título y la editorial del libro asociado (vía JOIN), para poder mostrarlos
 * y, más adelante, filtrar por título/editorial (RF-16).
 *
 * Se incluyen los registros de libros archivados: su historial se conserva
 * accesible (RF-04 / AC-04). Orden: del más reciente al más antiguo.
 */

export type EntradaHistorialPrecio = {
  id: number;
  libro_id: number;
  titulo: string;
  editorial: string;
  precio_anterior: number;
  precio_nuevo: number;
  origen: string;
  fecha: string;
};

export type EntradaHistorialStock = {
  id: number;
  libro_id: number;
  titulo: string;
  editorial: string;
  cantidad_anterior: number;
  cantidad_resultante: number;
  origen: string;
  fecha: string;
};

export type EntradaHistorialVenta = {
  id: number;
  libro_id: number;
  titulo: string;
  editorial: string;
  precio_venta: number;
  fecha: string;
};

/** Historial de cambios de precio (RF-14). */
export function listarHistorialPrecio(
  db: Database.Database,
): EntradaHistorialPrecio[] {
  return db
    .prepare(
      `SELECT hp.id, hp.libro_id, l.titulo, l.editorial,
              hp.precio_anterior, hp.precio_nuevo, hp.origen, hp.fecha
         FROM historial_precio hp
         JOIN libros l ON l.id = hp.libro_id
        ORDER BY hp.fecha DESC, hp.id DESC`,
    )
    .all() as EntradaHistorialPrecio[];
}

/** Historial de cambios de stock (RF-13). */
export function listarHistorialStock(
  db: Database.Database,
): EntradaHistorialStock[] {
  return db
    .prepare(
      `SELECT hs.id, hs.libro_id, l.titulo, l.editorial,
              hs.cantidad_anterior, hs.cantidad_resultante, hs.origen, hs.fecha
         FROM historial_stock hs
         JOIN libros l ON l.id = hs.libro_id
        ORDER BY hs.fecha DESC, hs.id DESC`,
    )
    .all() as EntradaHistorialStock[];
}

/** Historial de ventas (RF-12). */
export function listarHistorialVenta(
  db: Database.Database,
): EntradaHistorialVenta[] {
  return db
    .prepare(
      `SELECT hv.id, hv.libro_id, l.titulo, l.editorial,
              hv.precio_venta, hv.fecha
         FROM historial_venta hv
         JOIN libros l ON l.id = hv.libro_id
        ORDER BY hv.fecha DESC, hv.id DESC`,
    )
    .all() as EntradaHistorialVenta[];
}
