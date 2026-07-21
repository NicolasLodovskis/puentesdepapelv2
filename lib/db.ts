import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { initSchema } from "./schema";

/**
 * Capa de acceso a datos. La persistencia es un único archivo SQLite local,
 * sin servidor (Restricción del PRD / RNF-03). La conexión es un singleton:
 * una sola instancia para todo el proceso.
 */

let db: Database.Database | null = null;

/** Ruta del archivo `.db`. Configurable por env para tests; por defecto
 * `data/puentes.db` dentro del proyecto. El valor especial `:memory:` crea
 * una base en memoria (usado en tests). */
function resolveDbPath(): string {
  return process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "puentes.db");
}

/**
 * Abre una conexión nueva, aplica los PRAGMAs e inicializa el esquema.
 * No usa el singleton: útil para tests que quieren una base aislada.
 */
export function createDb(dbPath: string): Database.Database {
  if (dbPath !== ":memory:") {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }
  const instance = new Database(dbPath);
  // WAL: mejor concurrencia lectura/escritura. En :memory: SQLite lo ignora.
  instance.pragma("journal_mode = WAL");
  // Respetar claves foráneas (SQLite las desactiva por defecto).
  instance.pragma("foreign_keys = ON");
  initSchema(instance);
  return instance;
}

/** Devuelve la conexión singleton, creándola en el primer uso. */
export function getDb(): Database.Database {
  if (!db) {
    db = createDb(resolveDbPath());
  }
  return db;
}

/** Cierra la conexión singleton (principalmente para tests). */
export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
