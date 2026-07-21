import { describe, it, expect, afterEach } from "vitest";
import { createDb, getDb, closeDb } from "../lib/db";

describe("capa de datos (conexión SQLite)", () => {
  afterEach(() => {
    closeDb();
    delete process.env.DATABASE_PATH;
  });

  it("crea la tabla interna _meta al inicializar el esquema", () => {
    const db = createDb(":memory:");
    const tabla = db
      .prepare(
        "select name from sqlite_master where type='table' and name='_meta'",
      )
      .get();
    expect(tabla).toBeTruthy();
    db.close();
  });

  it("activa foreign_keys", () => {
    const db = createDb(":memory:");
    expect(db.pragma("foreign_keys", { simple: true })).toBe(1);
    db.close();
  });

  it("getDb devuelve siempre la misma instancia (singleton)", () => {
    process.env.DATABASE_PATH = ":memory:";
    const a = getDb();
    const b = getDb();
    expect(a).toBe(b);
  });

  it("closeDb permite volver a abrir una instancia nueva", () => {
    process.env.DATABASE_PATH = ":memory:";
    const a = getDb();
    closeDb();
    const b = getDb();
    expect(a).not.toBe(b);
  });
});
