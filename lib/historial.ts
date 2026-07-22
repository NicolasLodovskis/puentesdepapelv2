import type Database from "better-sqlite3";

/**
 * Lectura de los historiales (RF-15) con filtros opcionales (RF-16). Cada
 * entrada se devuelve junto con el título y la editorial del libro asociado
 * (vía JOIN), para poder mostrarlos y filtrar por título/editorial.
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

/** Filtros de historial (RF-16). Todos opcionales. Fechas en `YYYY-MM-DD`. */
export type FiltroHistorial = {
  desde?: string;
  hasta?: string;
  titulo?: string;
  editorial?: string;
};

/** Escapa los comodines de LIKE (`%`, `_`) y el propio escape (`\`). */
function escaparLike(texto: string): string {
  return texto.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/**
 * Construye la cláusula WHERE (condiciones extra) y los parámetros a partir de
 * un filtro. `aliasFecha` es el alias de la tabla de historial (hp/hs/hv); el
 * título y la editorial se comparan sobre el libro (alias `l`).
 */
function construirFiltro(
  filtro: FiltroHistorial,
  aliasFecha: string,
): { condiciones: string; params: Record<string, string> } {
  const cond: string[] = [];
  const params: Record<string, string> = {};

  if (filtro.desde && filtro.desde.trim() !== "") {
    cond.push(`date(${aliasFecha}.fecha) >= @desde`);
    params.desde = filtro.desde.trim();
  }
  if (filtro.hasta && filtro.hasta.trim() !== "") {
    cond.push(`date(${aliasFecha}.fecha) <= @hasta`);
    params.hasta = filtro.hasta.trim();
  }
  if (filtro.titulo && filtro.titulo.trim() !== "") {
    cond.push(`l.titulo LIKE @titulo ESCAPE '\\'`);
    params.titulo = `%${escaparLike(filtro.titulo.trim())}%`;
  }
  if (filtro.editorial && filtro.editorial.trim() !== "") {
    cond.push(`l.editorial LIKE @editorial ESCAPE '\\'`);
    params.editorial = `%${escaparLike(filtro.editorial.trim())}%`;
  }

  return {
    condiciones: cond.length > 0 ? `AND ${cond.join(" AND ")}` : "",
    params,
  };
}

function ejecutar<T>(
  db: Database.Database,
  sql: string,
  params: Record<string, string>,
): T[] {
  const stmt = db.prepare(sql);
  return (
    Object.keys(params).length > 0 ? stmt.all(params) : stmt.all()
  ) as T[];
}

/** Historial de cambios de precio (RF-14), con filtros opcionales (RF-16). */
export function listarHistorialPrecio(
  db: Database.Database,
  filtro: FiltroHistorial = {},
): EntradaHistorialPrecio[] {
  const { condiciones, params } = construirFiltro(filtro, "hp");
  return ejecutar<EntradaHistorialPrecio>(
    db,
    `SELECT hp.id, hp.libro_id, l.titulo, l.editorial,
            hp.precio_anterior, hp.precio_nuevo, hp.origen, hp.fecha
       FROM historial_precio hp
       JOIN libros l ON l.id = hp.libro_id
      WHERE 1 = 1 ${condiciones}
      ORDER BY hp.fecha DESC, hp.id DESC`,
    params,
  );
}

/** Historial de cambios de stock (RF-13), con filtros opcionales (RF-16). */
export function listarHistorialStock(
  db: Database.Database,
  filtro: FiltroHistorial = {},
): EntradaHistorialStock[] {
  const { condiciones, params } = construirFiltro(filtro, "hs");
  return ejecutar<EntradaHistorialStock>(
    db,
    `SELECT hs.id, hs.libro_id, l.titulo, l.editorial,
            hs.cantidad_anterior, hs.cantidad_resultante, hs.origen, hs.fecha
       FROM historial_stock hs
       JOIN libros l ON l.id = hs.libro_id
      WHERE 1 = 1 ${condiciones}
      ORDER BY hs.fecha DESC, hs.id DESC`,
    params,
  );
}

/** Historial de ventas (RF-12), con filtros opcionales (RF-16). */
export function listarHistorialVenta(
  db: Database.Database,
  filtro: FiltroHistorial = {},
): EntradaHistorialVenta[] {
  const { condiciones, params } = construirFiltro(filtro, "hv");
  return ejecutar<EntradaHistorialVenta>(
    db,
    `SELECT hv.id, hv.libro_id, l.titulo, l.editorial,
            hv.precio_venta, hv.fecha
       FROM historial_venta hv
       JOIN libros l ON l.id = hv.libro_id
      WHERE 1 = 1 ${condiciones}
      ORDER BY hv.fecha DESC, hv.id DESC`,
    params,
  );
}
