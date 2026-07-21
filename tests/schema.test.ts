import { describe, it, expect } from "vitest";
import { createDb } from "../lib/db";

function nuevoLibro(db: ReturnType<typeof createDb>) {
  return db
    .prepare(
      "INSERT INTO libros (titulo, editorial, stock, precio) VALUES (?, ?, ?, ?)",
    )
    .run("El Aleph", "Emecé", 5, 1000);
}

describe("esquema de la base", () => {
  it("crea las cuatro tablas del modelo", () => {
    const db = createDb(":memory:");
    const tablas = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
      )
      .all()
      .map((r: any) => r.name);
    expect(tablas).toEqual(
      expect.arrayContaining([
        "libros",
        "historial_precio",
        "historial_stock",
        "historial_venta",
      ]),
    );
    db.close();
  });

  it("inserta un libro con defaults (archivado=0 y timestamps)", () => {
    const db = createDb(":memory:");
    const { lastInsertRowid } = nuevoLibro(db);
    const libro: any = db
      .prepare("SELECT * FROM libros WHERE id = ?")
      .get(lastInsertRowid);
    expect(libro.archivado).toBe(0);
    expect(libro.foto).toBeNull();
    expect(libro.creado_en).toBeTruthy();
    expect(libro.actualizado_en).toBeTruthy();
    db.close();
  });

  it("rechaza stock negativo (CHECK stock >= 0)", () => {
    const db = createDb(":memory:");
    expect(() =>
      db
        .prepare(
          "INSERT INTO libros (titulo, editorial, stock, precio) VALUES (?, ?, ?, ?)",
        )
        .run("X", "Ed", -1, 100),
    ).toThrow();
    db.close();
  });

  it("rechaza precio <= 0 (CHECK precio > 0)", () => {
    const db = createDb(":memory:");
    expect(() =>
      db
        .prepare(
          "INSERT INTO libros (titulo, editorial, stock, precio) VALUES (?, ?, ?, ?)",
        )
        .run("X", "Ed", 1, 0),
    ).toThrow();
    db.close();
  });

  it("aplica la clave foránea libro_id en los historiales", () => {
    const db = createDb(":memory:");
    expect(() =>
      db
        .prepare(
          "INSERT INTO historial_precio (libro_id, precio_anterior, precio_nuevo, origen) VALUES (?, ?, ?, ?)",
        )
        .run(999, 100, 200, "edición manual"),
    ).toThrow();
    db.close();
  });

  it("rechaza un origen inválido en historial_stock (CHECK origen)", () => {
    const db = createDb(":memory:");
    const { lastInsertRowid } = nuevoLibro(db);
    expect(() =>
      db
        .prepare(
          "INSERT INTO historial_stock (libro_id, cantidad_anterior, cantidad_resultante, origen) VALUES (?, ?, ?, ?)",
        )
        .run(lastInsertRowid, 5, 4, "motivo inventado"),
    ).toThrow();
    db.close();
  });

  it("acepta los historiales válidos ligados a un libro", () => {
    const db = createDb(":memory:");
    const { lastInsertRowid: id } = nuevoLibro(db);
    expect(() => {
      db.prepare(
        "INSERT INTO historial_precio (libro_id, precio_anterior, precio_nuevo, origen) VALUES (?, ?, ?, ?)",
      ).run(id, 1000, 1200, "edición manual");
      db.prepare(
        "INSERT INTO historial_stock (libro_id, cantidad_anterior, cantidad_resultante, origen) VALUES (?, ?, ?, ?)",
      ).run(id, 5, 4, "venta");
      db.prepare(
        "INSERT INTO historial_venta (libro_id, precio_venta) VALUES (?, ?)",
      ).run(id, 1000);
    }).not.toThrow();
    db.close();
  });
});
