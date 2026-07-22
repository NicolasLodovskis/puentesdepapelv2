import type Database from "better-sqlite3";
import { SQL_AHORA_UTC3 } from "./tiempo";

/**
 * Crea las tablas de la base si no existen. Idempotente: se puede llamar en
 * cada arranque sin efectos secundarios.
 *
 * Modelo (alcance actual del PRD):
 *  - `libros`: ABM de libros (RF-01). `archivado` queda previsto para la baja
 *    lógica (RF-04, fuera de alcance) para no migrar después.
 *  - `historial_precio` (RF-14), `historial_stock` (RF-13) e
 *    `historial_venta` (RF-12): trazabilidad de cada cambio.
 *
 * Fechas: TEXT en formato `YYYY-MM-DD HH:MM:SS` en UTC-3 (hora de Argentina),
 * por defecto vía `SQL_AHORA_UTC3`.
 * Los CHECK de `origen` incluyen también los valores de los flujos de Excel
 * (fuera de alcance) para dejar el esquema alineado al PRD y evitar migrar.
 */
export function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _meta (
      clave TEXT PRIMARY KEY,
      valor TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS libros (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo         TEXT    NOT NULL,
      editorial      TEXT    NOT NULL,
      foto           TEXT,
      stock          INTEGER NOT NULL CHECK (stock >= 0),
      precio         REAL    NOT NULL CHECK (precio > 0),
      archivado      INTEGER NOT NULL DEFAULT 0 CHECK (archivado IN (0, 1)),
      creado_en      TEXT    NOT NULL DEFAULT (${SQL_AHORA_UTC3}),
      actualizado_en TEXT    NOT NULL DEFAULT (${SQL_AHORA_UTC3})
    );

    CREATE INDEX IF NOT EXISTS idx_libros_titulo    ON libros (titulo);
    CREATE INDEX IF NOT EXISTS idx_libros_editorial ON libros (editorial);

    CREATE TABLE IF NOT EXISTS historial_precio (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      libro_id        INTEGER NOT NULL REFERENCES libros (id),
      precio_anterior REAL    NOT NULL,
      precio_nuevo    REAL    NOT NULL,
      origen          TEXT    NOT NULL CHECK (
                        origen IN (
                          'edición manual',
                          'actualización masiva por Excel',
                          'alta por Excel'
                        )
                      ),
      fecha           TEXT    NOT NULL DEFAULT (${SQL_AHORA_UTC3})
    );

    CREATE INDEX IF NOT EXISTS idx_historial_precio_libro ON historial_precio (libro_id);
    CREATE INDEX IF NOT EXISTS idx_historial_precio_fecha ON historial_precio (fecha);

    CREATE TABLE IF NOT EXISTS historial_stock (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      libro_id            INTEGER NOT NULL REFERENCES libros (id),
      cantidad_anterior   INTEGER NOT NULL,
      cantidad_resultante INTEGER NOT NULL,
      origen              TEXT    NOT NULL CHECK (
                            origen IN (
                              'venta',
                              'edición manual',
                              'alta por Excel'
                            )
                          ),
      fecha               TEXT    NOT NULL DEFAULT (${SQL_AHORA_UTC3})
    );

    CREATE INDEX IF NOT EXISTS idx_historial_stock_libro ON historial_stock (libro_id);
    CREATE INDEX IF NOT EXISTS idx_historial_stock_fecha ON historial_stock (fecha);

    CREATE TABLE IF NOT EXISTS historial_venta (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      libro_id     INTEGER NOT NULL REFERENCES libros (id),
      precio_venta REAL    NOT NULL,
      fecha        TEXT    NOT NULL DEFAULT (${SQL_AHORA_UTC3})
    );

    CREATE INDEX IF NOT EXISTS idx_historial_venta_libro ON historial_venta (libro_id);
    CREATE INDEX IF NOT EXISTS idx_historial_venta_fecha ON historial_venta (fecha);
  `);
}
