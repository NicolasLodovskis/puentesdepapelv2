import { describe, it, expect } from "vitest";
import { createDb } from "../lib/db";
import {
  crearLibro,
  obtenerLibro,
  listarLibros,
  validarNuevoLibro,
  ErrorValidacion,
  type NuevoLibro,
} from "../lib/libros";

const valido: NuevoLibro = {
  titulo: "El Aleph",
  editorial: "Emecé",
  stock: 5,
  precio: 1000,
};

function contarLibros(db: ReturnType<typeof createDb>): number {
  return (db.prepare("SELECT COUNT(*) c FROM libros").get() as { c: number }).c;
}

describe("validarNuevoLibro (AC-01)", () => {
  it("no reporta errores con datos válidos", () => {
    expect(validarNuevoLibro(valido)).toEqual([]);
  });

  it("acepta stock = 0", () => {
    expect(validarNuevoLibro({ ...valido, stock: 0 })).toEqual([]);
  });

  it("rechaza título vacío o en blanco", () => {
    expect(validarNuevoLibro({ ...valido, titulo: "" }).length).toBeGreaterThan(0);
    expect(validarNuevoLibro({ ...valido, titulo: "   " }).length).toBeGreaterThan(0);
  });

  it("rechaza editorial vacía", () => {
    expect(validarNuevoLibro({ ...valido, editorial: "" }).length).toBeGreaterThan(0);
  });

  it("rechaza stock negativo o no entero", () => {
    expect(validarNuevoLibro({ ...valido, stock: -1 }).length).toBeGreaterThan(0);
    expect(validarNuevoLibro({ ...valido, stock: 2.5 }).length).toBeGreaterThan(0);
    expect(validarNuevoLibro({ ...valido, stock: NaN }).length).toBeGreaterThan(0);
  });

  it("rechaza precio <= 0 o no numérico", () => {
    expect(validarNuevoLibro({ ...valido, precio: 0 }).length).toBeGreaterThan(0);
    expect(validarNuevoLibro({ ...valido, precio: -100 }).length).toBeGreaterThan(0);
    expect(validarNuevoLibro({ ...valido, precio: NaN }).length).toBeGreaterThan(0);
  });
});

describe("crearLibro (AC-01)", () => {
  it("persiste un libro válido y es recuperable después", () => {
    const db = createDb(":memory:");
    const libro = crearLibro(db, valido);
    expect(libro.id).toBeGreaterThan(0);

    const recuperado = obtenerLibro(db, libro.id);
    expect(recuperado).toBeTruthy();
    expect(recuperado!.titulo).toBe("El Aleph");
    expect(recuperado!.editorial).toBe("Emecé");
    expect(recuperado!.stock).toBe(5);
    expect(recuperado!.precio).toBe(1000);
    expect(recuperado!.archivado).toBe(0);
    db.close();
  });

  it("recorta espacios y deja foto en null si viene vacía", () => {
    const db = createDb(":memory:");
    const libro = crearLibro(db, {
      ...valido,
      titulo: "  Ficciones  ",
      foto: "   ",
    });
    expect(libro.titulo).toBe("Ficciones");
    expect(libro.foto).toBeNull();
    db.close();
  });

  it("guarda la foto cuando se provee", () => {
    const db = createDb(":memory:");
    const libro = crearLibro(db, { ...valido, foto: "/fotos/aleph.jpg" });
    expect(libro.foto).toBe("/fotos/aleph.jpg");
    db.close();
  });

  it("lanza ErrorValidacion y no persiste nada con datos inválidos", () => {
    const db = createDb(":memory:");
    expect(() => crearLibro(db, { ...valido, titulo: "", precio: 0 })).toThrow(
      ErrorValidacion,
    );
    expect(contarLibros(db)).toBe(0);
    db.close();
  });
});

describe("listarLibros", () => {
  it("lista los libros cargados", () => {
    const db = createDb(":memory:");
    crearLibro(db, { ...valido, titulo: "Uno" });
    crearLibro(db, { ...valido, titulo: "Dos" });
    const titulos = listarLibros(db).map((l) => l.titulo);
    expect(titulos).toContain("Uno");
    expect(titulos).toContain("Dos");
    db.close();
  });

  it("excluye los libros archivados", () => {
    const db = createDb(":memory:");
    const activo = crearLibro(db, { ...valido, titulo: "Activo" });
    const archivado = crearLibro(db, { ...valido, titulo: "Archivado" });
    db.prepare("UPDATE libros SET archivado = 1 WHERE id = ?").run(archivado.id);

    const ids = listarLibros(db).map((l) => l.id);
    expect(ids).toContain(activo.id);
    expect(ids).not.toContain(archivado.id);
    db.close();
  });
});
