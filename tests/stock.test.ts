import { describe, it, expect } from "vitest";
import { createDb } from "../lib/db";
import {
  crearLibro,
  modificarStock,
  ErrorValidacion,
  ErrorNoEncontrado,
  type NuevoLibro,
} from "../lib/libros";

const base: NuevoLibro = {
  titulo: "El Aleph",
  editorial: "Emecé",
  stock: 5,
  precio: 1000,
};

function historialStock(db: ReturnType<typeof createDb>, libroId: number) {
  return db
    .prepare("SELECT * FROM historial_stock WHERE libro_id = ? ORDER BY id")
    .all(libroId) as Array<{
    cantidad_anterior: number;
    cantidad_resultante: number;
    origen: string;
    fecha: string;
  }>;
}

describe("modificarStock (AC-03: RF-03 + RF-13)", () => {
  it("actualiza el stock y registra el cambio en el historial", () => {
    const db = createDb(":memory:");
    const libro = crearLibro(db, base); // stock 5

    const actualizado = modificarStock(db, libro.id, 12);
    expect(actualizado.stock).toBe(12);

    const hist = historialStock(db, libro.id);
    expect(hist).toHaveLength(1);
    expect(hist[0].cantidad_anterior).toBe(5);
    expect(hist[0].cantidad_resultante).toBe(12);
    expect(hist[0].origen).toBe("edición manual");
    expect(hist[0].fecha).toBeTruthy();
    db.close();
  });

  it("acepta stock = 0", () => {
    const db = createDb(":memory:");
    const libro = crearLibro(db, base);
    const actualizado = modificarStock(db, libro.id, 0);
    expect(actualizado.stock).toBe(0);
    expect(historialStock(db, libro.id)[0].cantidad_resultante).toBe(0);
    db.close();
  });

  it("rechaza stock negativo o no entero sin tocar el libro ni el historial", () => {
    const db = createDb(":memory:");
    const libro = crearLibro(db, base);

    expect(() => modificarStock(db, libro.id, -1)).toThrow(ErrorValidacion);
    expect(() => modificarStock(db, libro.id, 2.5)).toThrow(ErrorValidacion);

    expect(historialStock(db, libro.id)).toHaveLength(0);
    expect(
      db.prepare("SELECT stock FROM libros WHERE id = ?").get(libro.id),
    ).toEqual({ stock: 5 });
    db.close();
  });

  it("lanza ErrorNoEncontrado si el libro no existe", () => {
    const db = createDb(":memory:");
    expect(() => modificarStock(db, 999, 3)).toThrow(ErrorNoEncontrado);
    db.close();
  });
});
