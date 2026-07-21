import type Database from "better-sqlite3";

/**
 * Crea las tablas de la base si no existen. Idempotente: se puede llamar en
 * cada arranque sin efectos secundarios.
 *
 * Por ahora sólo crea la tabla interna `_meta` (metadatos de la base). Las
 * tablas de dominio (libros e historiales de precio, stock y ventas) se
 * agregan en el paso 4.
 */
export function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _meta (
      clave TEXT PRIMARY KEY,
      valor TEXT NOT NULL
    );
  `);
}
