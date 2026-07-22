import { describe, it, expect } from "vitest";
import { createDb } from "../lib/db";
import {
  crearLibro,
  marcarVendido,
  ErrorStockInsuficiente,
  ErrorNoEncontrado,
  type NuevoLibro,
} from "../lib/libros";

const base: NuevoLibro = {
  titulo: "El Aleph",
  editorial: "Emecé",
  stock: 3,
  precio: 1000,
};

function ventas(db: ReturnType<typeof createDb>, libroId: number) {
  return db
    .prepare("SELECT * FROM historial_venta WHERE libro_id = ? ORDER BY id")
    .all(libroId) as Array<{ precio_venta: number; fecha: string }>;
}

function stockHist(db: ReturnType<typeof createDb>, libroId: number) {
  return db
    .prepare("SELECT * FROM historial_stock WHERE libro_id = ? ORDER BY id")
    .all(libroId) as Array<{
    cantidad_anterior: number;
    cantidad_resultante: number;
    origen: string;
  }>;
}

describe("marcarVendido (AC-05: RF-05 + RF-12 + RF-13)", () => {
  it("descuenta 1 del stock y registra venta e historial de stock", () => {
    const db = createDb(":memory:");
    const libro = crearLibro(db, base); // stock 3, precio 1000

    const actualizado = marcarVendido(db, libro.id);
    expect(actualizado.stock).toBe(2);

    const v = ventas(db, libro.id);
    expect(v).toHaveLength(1);
    expect(v[0].precio_venta).toBe(1000); // precio vigente al momento
    expect(v[0].fecha).toBeTruthy();

    const s = stockHist(db, libro.id);
    expect(s).toHaveLength(1);
    expect(s[0].cantidad_anterior).toBe(3);
    expect(s[0].cantidad_resultante).toBe(2);
    expect(s[0].origen).toBe("venta");
    db.close();
  });

  it("guarda la fecha de la venta en UTC-3 (no en UTC)", () => {
    const db = createDb(":memory:");
    const libro = crearLibro(db, base);

    const antes = (
      db.prepare("SELECT datetime('now','-3 hours') t").get() as { t: string }
    ).t;
    marcarVendido(db, libro.id);
    const despues = (
      db.prepare("SELECT datetime('now','-3 hours') t").get() as { t: string }
    ).t;

    const fecha = ventas(db, libro.id)[0].fecha;
    // La fecha guardada cae en la ventana UTC-3; si fuera UTC estaría ~3h
    // adelantada y quedaría fuera del rango.
    expect(fecha >= antes && fecha <= despues).toBe(true);
    db.close();
  });

  it("registra el precio vigente aunque haya cambiado antes de la venta", () => {
    const db = createDb(":memory:");
    const libro = crearLibro(db, { ...base, precio: 1000 });
    // Simula que el precio vigente es otro al vender.
    db.prepare("UPDATE libros SET precio = 1500 WHERE id = ?").run(libro.id);

    marcarVendido(db, libro.id);
    expect(ventas(db, libro.id)[0].precio_venta).toBe(1500);
    db.close();
  });

  it("permite vender hasta agotar el stock", () => {
    const db = createDb(":memory:");
    const libro = crearLibro(db, { ...base, stock: 2 });
    marcarVendido(db, libro.id);
    const ultimo = marcarVendido(db, libro.id);
    expect(ultimo.stock).toBe(0);
    expect(ventas(db, libro.id)).toHaveLength(2);
    db.close();
  });
});

describe("marcarVendido con stock 0 (AC-06)", () => {
  it("impide la venta, no cambia el stock ni registra nada", () => {
    const db = createDb(":memory:");
    const libro = crearLibro(db, { ...base, stock: 0 });

    expect(() => marcarVendido(db, libro.id)).toThrow(ErrorStockInsuficiente);

    expect(
      db.prepare("SELECT stock FROM libros WHERE id = ?").get(libro.id),
    ).toEqual({ stock: 0 });
    expect(ventas(db, libro.id)).toHaveLength(0);
    expect(stockHist(db, libro.id)).toHaveLength(0);
    db.close();
  });

  it("lanza ErrorNoEncontrado si el libro no existe", () => {
    const db = createDb(":memory:");
    expect(() => marcarVendido(db, 999)).toThrow(ErrorNoEncontrado);
    db.close();
  });
});
