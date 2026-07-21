import { describe, it, expect } from "vitest";
import { createDb } from "../lib/db";
import {
  crearLibro,
  modificarPrecio,
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

function historialPrecio(db: ReturnType<typeof createDb>, libroId: number) {
  return db
    .prepare(
      "SELECT * FROM historial_precio WHERE libro_id = ? ORDER BY id",
    )
    .all(libroId) as Array<{
    precio_anterior: number;
    precio_nuevo: number;
    origen: string;
    fecha: string;
  }>;
}

describe("modificarPrecio (AC-02: RF-02 + RF-14)", () => {
  it("actualiza el precio y registra el cambio en el historial", () => {
    const db = createDb(":memory:");
    const libro = crearLibro(db, base); // precio 1000

    const actualizado = modificarPrecio(db, libro.id, 1200);
    expect(actualizado.precio).toBe(1200);

    const hist = historialPrecio(db, libro.id);
    expect(hist).toHaveLength(1);
    expect(hist[0].precio_anterior).toBe(1000);
    expect(hist[0].precio_nuevo).toBe(1200);
    expect(hist[0].origen).toBe("edición manual");
    expect(hist[0].fecha).toBeTruthy();
    db.close();
  });

  it("acumula una entrada de historial por cada cambio", () => {
    const db = createDb(":memory:");
    const libro = crearLibro(db, base);
    modificarPrecio(db, libro.id, 1200);
    modificarPrecio(db, libro.id, 1500);

    const hist = historialPrecio(db, libro.id);
    expect(hist).toHaveLength(2);
    expect(hist[1].precio_anterior).toBe(1200);
    expect(hist[1].precio_nuevo).toBe(1500);
    db.close();
  });

  it("rechaza precio <= 0 sin tocar el libro ni el historial", () => {
    const db = createDb(":memory:");
    const libro = crearLibro(db, base);

    expect(() => modificarPrecio(db, libro.id, 0)).toThrow(ErrorValidacion);
    expect(() => modificarPrecio(db, libro.id, -5)).toThrow(ErrorValidacion);

    expect(historialPrecio(db, libro.id)).toHaveLength(0);
    expect(db.prepare("SELECT precio FROM libros WHERE id = ?").get(libro.id)).toEqual({
      precio: 1000,
    });
    db.close();
  });

  it("lanza ErrorNoEncontrado si el libro no existe", () => {
    const db = createDb(":memory:");
    expect(() => modificarPrecio(db, 999, 1200)).toThrow(ErrorNoEncontrado);
    db.close();
  });
});
