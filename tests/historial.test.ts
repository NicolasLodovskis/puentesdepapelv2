import { describe, it, expect } from "vitest";
import { createDb } from "../lib/db";
import {
  crearLibro,
  modificarPrecio,
  modificarStock,
  marcarVendido,
  type NuevoLibro,
} from "../lib/libros";
import {
  listarHistorialPrecio,
  listarHistorialStock,
  listarHistorialVenta,
} from "../lib/historial";

const base: NuevoLibro = {
  titulo: "El Aleph",
  editorial: "Emecé",
  stock: 5,
  precio: 1000,
};

describe("historial de precio (AC-13: RF-14 + RF-15)", () => {
  it("lista los cambios con título, valores y origen", () => {
    const db = createDb(":memory:");
    const libro = crearLibro(db, base);
    modificarPrecio(db, libro.id, 1200);

    const h = listarHistorialPrecio(db);
    expect(h).toHaveLength(1);
    expect(h[0].titulo).toBe("El Aleph");
    expect(h[0].editorial).toBe("Emecé");
    expect(h[0].precio_anterior).toBe(1000);
    expect(h[0].precio_nuevo).toBe(1200);
    expect(h[0].origen).toBe("edición manual");
    expect(h[0].fecha).toBeTruthy();
    db.close();
  });
});

describe("historial de stock (AC-13: RF-13 + RF-15)", () => {
  it("lista los cambios con cantidades y origen (edición y venta)", () => {
    const db = createDb(":memory:");
    const libro = crearLibro(db, base); // stock 5
    modificarStock(db, libro.id, 8); // edición manual: 5 -> 8
    marcarVendido(db, libro.id); // venta: 8 -> 7

    const h = listarHistorialStock(db);
    expect(h).toHaveLength(2);
    // Más reciente primero: la venta.
    expect(h[0].origen).toBe("venta");
    expect(h[0].cantidad_anterior).toBe(8);
    expect(h[0].cantidad_resultante).toBe(7);
    expect(h[1].origen).toBe("edición manual");
    expect(h[1].cantidad_anterior).toBe(5);
    expect(h[1].cantidad_resultante).toBe(8);
    expect(h[0].titulo).toBe("El Aleph");
    db.close();
  });
});

describe("historial de ventas (AC-13: RF-12 + RF-15)", () => {
  it("lista las ventas con título, precio de venta y fecha", () => {
    const db = createDb(":memory:");
    const libro = crearLibro(db, base);
    marcarVendido(db, libro.id);

    const h = listarHistorialVenta(db);
    expect(h).toHaveLength(1);
    expect(h[0].titulo).toBe("El Aleph");
    expect(h[0].precio_venta).toBe(1000);
    expect(h[0].fecha).toBeTruthy();
    db.close();
  });

  it("conserva el historial de libros archivados", () => {
    const db = createDb(":memory:");
    const libro = crearLibro(db, base);
    marcarVendido(db, libro.id);
    db.prepare("UPDATE libros SET archivado = 1 WHERE id = ?").run(libro.id);

    // Aunque el libro esté archivado, su venta sigue visible en el historial.
    expect(listarHistorialVenta(db)).toHaveLength(1);
    db.close();
  });
});
