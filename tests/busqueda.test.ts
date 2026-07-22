import { describe, it, expect } from "vitest";
import { createDb } from "../lib/db";
import { crearLibro, buscarLibros, type NuevoLibro } from "../lib/libros";

function sembrar(db: ReturnType<typeof createDb>) {
  const libros: NuevoLibro[] = [
    { titulo: "El Aleph", editorial: "Emecé", stock: 5, precio: 1000 },
    { titulo: "Ficciones", editorial: "Emecé", stock: 3, precio: 1200 },
    { titulo: "Rayuela", editorial: "Sudamericana", stock: 2, precio: 1500 },
  ];
  libros.forEach((l) => crearLibro(db, l));
}

describe("buscarLibros (AC-11: RF-10)", () => {
  it("encuentra por parte del título (insensible a mayúsculas)", () => {
    const db = createDb(":memory:");
    sembrar(db);
    const r = buscarLibros(db, "aleph");
    expect(r.map((l) => l.titulo)).toEqual(["El Aleph"]);
    db.close();
  });

  it("encuentra por editorial y devuelve el precio", () => {
    const db = createDb(":memory:");
    sembrar(db);
    const r = buscarLibros(db, "Emecé");
    expect(r.map((l) => l.titulo)).toEqual(["El Aleph", "Ficciones"]);
    expect(r.every((l) => typeof l.precio === "number")).toBe(true);
    db.close();
  });

  it("devuelve vacío cuando no hay coincidencias", () => {
    const db = createDb(":memory:");
    sembrar(db);
    expect(buscarLibros(db, "inexistente")).toEqual([]);
    db.close();
  });

  it("con consulta vacía o en blanco trae todos los libros ordenados alfabéticamente", () => {
    const db = createDb(":memory:");
    sembrar(db);
    expect(buscarLibros(db, "").map((l) => l.titulo)).toEqual([
      "El Aleph",
      "Ficciones",
      "Rayuela",
    ]);
    expect(buscarLibros(db, "   ").map((l) => l.titulo)).toEqual([
      "El Aleph",
      "Ficciones",
      "Rayuela",
    ]);
    db.close();
  });

  it("con consulta vacía excluye los libros archivados", () => {
    const db = createDb(":memory:");
    sembrar(db);
    const archivado = crearLibro(db, {
      titulo: "AAA Archivado",
      editorial: "Ed",
      stock: 1,
      precio: 500,
    });
    db.prepare("UPDATE libros SET archivado = 1 WHERE id = ?").run(archivado.id);
    expect(buscarLibros(db, "").map((l) => l.titulo)).toEqual([
      "El Aleph",
      "Ficciones",
      "Rayuela",
    ]);
    db.close();
  });

  it("excluye los libros archivados", () => {
    const db = createDb(":memory:");
    const libro = crearLibro(db, {
      titulo: "Archivado",
      editorial: "Ed",
      stock: 1,
      precio: 500,
    });
    db.prepare("UPDATE libros SET archivado = 1 WHERE id = ?").run(libro.id);
    expect(buscarLibros(db, "Archivado")).toEqual([]);
    db.close();
  });

  it("trata los comodines de LIKE como texto literal", () => {
    const db = createDb(":memory:");
    sembrar(db);
    // "%" no debe comportarse como comodín: no hay títulos con "%".
    expect(buscarLibros(db, "%")).toEqual([]);
    db.close();
  });
});
