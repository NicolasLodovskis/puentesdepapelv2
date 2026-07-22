import type Database from "better-sqlite3";

/** Datos para dar de alta un libro (RF-01). `foto` es opcional. */
export type NuevoLibro = {
  titulo: string;
  editorial: string;
  foto?: string | null;
  stock: number;
  precio: number;
};

/** Fila de la tabla `libros`. */
export type Libro = {
  id: number;
  titulo: string;
  editorial: string;
  foto: string | null;
  stock: number;
  precio: number;
  archivado: number;
  creado_en: string;
  actualizado_en: string;
};

/** Error de validación de negocio: agrupa uno o más mensajes. */
export class ErrorValidacion extends Error {
  errores: string[];
  constructor(errores: string[]) {
    super(errores.join(" "));
    this.name = "ErrorValidacion";
    this.errores = errores;
  }
}

/** El libro referenciado no existe. */
export class ErrorNoEncontrado extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "ErrorNoEncontrado";
  }
}

/** No se puede vender: el libro no tiene stock disponible. */
export class ErrorStockInsuficiente extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "ErrorStockInsuficiente";
  }
}

/** Orígenes posibles de un cambio de precio (RF-14). */
export type OrigenPrecio =
  | "edición manual"
  | "actualización masiva por Excel"
  | "alta por Excel";

/** Orígenes posibles de un cambio de stock (RF-13). */
export type OrigenStock = "venta" | "edición manual" | "alta por Excel";

/**
 * Valida los datos de alta (AC-01): título y editorial no vacíos, stock entero
 * ≥ 0, precio > 0. Devuelve la lista de errores (vacía si es válido).
 */
export function validarNuevoLibro(input: NuevoLibro): string[] {
  const errores: string[] = [];

  if (!input.titulo || input.titulo.trim() === "") {
    errores.push("El título es obligatorio.");
  }
  if (!input.editorial || input.editorial.trim() === "") {
    errores.push("La editorial es obligatoria.");
  }
  if (!Number.isInteger(input.stock) || input.stock < 0) {
    errores.push("El stock debe ser un número entero mayor o igual a 0.");
  }
  if (
    typeof input.precio !== "number" ||
    !Number.isFinite(input.precio) ||
    input.precio <= 0
  ) {
    errores.push("El precio debe ser un número mayor a 0.");
  }

  return errores;
}

/** Devuelve un libro por id, o `undefined` si no existe. */
export function obtenerLibro(
  db: Database.Database,
  id: number,
): Libro | undefined {
  return db.prepare("SELECT * FROM libros WHERE id = ?").get(id) as
    | Libro
    | undefined;
}

/** Lista los libros activos (no archivados), del más reciente al más antiguo. */
export function listarLibros(db: Database.Database): Libro[] {
  return db
    .prepare(
      "SELECT * FROM libros WHERE archivado = 0 ORDER BY creado_en DESC, id DESC",
    )
    .all() as Libro[];
}

/** Escapa los comodines de LIKE (`%`, `_`) y el propio escape (`\`). */
function escaparLike(texto: string): string {
  return texto.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/**
 * Busca libros **activos** cuyo título o editorial contengan el texto de la
 * consulta (RF-10). Devuelve los libros coincidentes (con su precio),
 * ordenados alfabéticamente por título (insensible a mayúsculas). La
 * comparación es insensible a mayúsculas (LIKE de SQLite para ASCII). Una
 * consulta vacía o en blanco devuelve **todos** los libros activos.
 */
export function buscarLibros(db: Database.Database, consulta: string): Libro[] {
  const texto = consulta.trim();

  if (texto === "") {
    return db
      .prepare(
        "SELECT * FROM libros WHERE archivado = 0 ORDER BY titulo COLLATE NOCASE",
      )
      .all() as Libro[];
  }

  const patron = `%${escaparLike(texto)}%`;
  return db
    .prepare(
      `SELECT * FROM libros
         WHERE archivado = 0
           AND (titulo LIKE @patron ESCAPE '\\' OR editorial LIKE @patron ESCAPE '\\')
         ORDER BY titulo COLLATE NOCASE`,
    )
    .all({ patron }) as Libro[];
}

/** Valida un precio: número finito > 0. Devuelve la lista de errores. */
export function validarPrecio(precio: number): string[] {
  if (typeof precio !== "number" || !Number.isFinite(precio) || precio <= 0) {
    return ["El precio debe ser un número mayor a 0."];
  }
  return [];
}

/**
 * Modifica el precio de un libro (RF-02) y registra el cambio en el historial
 * de precio (RF-14): fecha, precio anterior, precio nuevo y origen. La
 * actualización y el registro se hacen en una transacción (AC-02).
 *
 * Lanza `ErrorValidacion` si el precio es inválido y `ErrorNoEncontrado` si el
 * libro no existe (en ambos casos no persiste nada).
 */
export function modificarPrecio(
  db: Database.Database,
  libroId: number,
  nuevoPrecio: number,
  origen: OrigenPrecio = "edición manual",
): Libro {
  const errores = validarPrecio(nuevoPrecio);
  if (errores.length > 0) {
    throw new ErrorValidacion(errores);
  }

  const libro = obtenerLibro(db, libroId);
  if (!libro) {
    throw new ErrorNoEncontrado(`No existe el libro con id ${libroId}.`);
  }

  const precioAnterior = libro.precio;

  const tx = db.transaction(() => {
    db.prepare(
      "UPDATE libros SET precio = ?, actualizado_en = datetime('now') WHERE id = ?",
    ).run(nuevoPrecio, libroId);
    db.prepare(
      "INSERT INTO historial_precio (libro_id, precio_anterior, precio_nuevo, origen) VALUES (?, ?, ?, ?)",
    ).run(libroId, precioAnterior, nuevoPrecio, origen);
  });
  tx();

  return obtenerLibro(db, libroId)!;
}

/** Valida un stock: entero ≥ 0. Devuelve la lista de errores. */
export function validarStock(stock: number): string[] {
  if (!Number.isInteger(stock) || stock < 0) {
    return ["El stock debe ser un número entero mayor o igual a 0."];
  }
  return [];
}

/**
 * Modifica manualmente el stock de un libro (RF-03) y registra el cambio en el
 * historial de stock (RF-13): fecha, cantidad anterior, cantidad resultante y
 * origen. La actualización y el registro se hacen en una transacción (AC-03).
 *
 * Lanza `ErrorValidacion` si el stock es inválido y `ErrorNoEncontrado` si el
 * libro no existe (en ambos casos no persiste nada).
 */
export function modificarStock(
  db: Database.Database,
  libroId: number,
  nuevoStock: number,
  origen: OrigenStock = "edición manual",
): Libro {
  const errores = validarStock(nuevoStock);
  if (errores.length > 0) {
    throw new ErrorValidacion(errores);
  }

  const libro = obtenerLibro(db, libroId);
  if (!libro) {
    throw new ErrorNoEncontrado(`No existe el libro con id ${libroId}.`);
  }

  const cantidadAnterior = libro.stock;

  const tx = db.transaction(() => {
    db.prepare(
      "UPDATE libros SET stock = ?, actualizado_en = datetime('now') WHERE id = ?",
    ).run(nuevoStock, libroId);
    db.prepare(
      "INSERT INTO historial_stock (libro_id, cantidad_anterior, cantidad_resultante, origen) VALUES (?, ?, ?, ?)",
    ).run(libroId, cantidadAnterior, nuevoStock, origen);
  });
  tx();

  return obtenerLibro(db, libroId)!;
}

/**
 * Marca un libro como vendido (RF-05): descuenta 1 del stock, registra la
 * venta en el historial de ventas (fecha y precio vigente, RF-12) y registra
 * el cambio en el historial de stock (origen "venta", RF-13). Todo en una
 * transacción (AC-05).
 *
 * Lanza `ErrorNoEncontrado` si el libro no existe y `ErrorStockInsuficiente`
 * si el stock es 0 (no descuenta ni registra nada, AC-06).
 */
export function marcarVendido(db: Database.Database, libroId: number): Libro {
  const libro = obtenerLibro(db, libroId);
  if (!libro) {
    throw new ErrorNoEncontrado(`No existe el libro con id ${libroId}.`);
  }
  if (libro.stock < 1) {
    throw new ErrorStockInsuficiente(
      "No hay stock disponible para marcar como vendido.",
    );
  }

  const cantidadAnterior = libro.stock;
  const cantidadResultante = cantidadAnterior - 1;
  const precioVenta = libro.precio;

  const tx = db.transaction(() => {
    db.prepare(
      "UPDATE libros SET stock = ?, actualizado_en = datetime('now') WHERE id = ?",
    ).run(cantidadResultante, libroId);
    db.prepare(
      "INSERT INTO historial_venta (libro_id, precio_venta) VALUES (?, ?)",
    ).run(libroId, precioVenta);
    db.prepare(
      "INSERT INTO historial_stock (libro_id, cantidad_anterior, cantidad_resultante, origen) VALUES (?, ?, ?, ?)",
    ).run(libroId, cantidadAnterior, cantidadResultante, "venta");
  });
  tx();

  return obtenerLibro(db, libroId)!;
}

/**
 * Da de alta un libro (RF-01). Valida los datos y, si son correctos, lo
 * persiste. Lanza `ErrorValidacion` si algún dato es inválido (no persiste
 * nada en ese caso).
 */
export function crearLibro(db: Database.Database, input: NuevoLibro): Libro {
  const errores = validarNuevoLibro(input);
  if (errores.length > 0) {
    throw new ErrorValidacion(errores);
  }

  const titulo = input.titulo.trim();
  const editorial = input.editorial.trim();
  const foto = input.foto && input.foto.trim() !== "" ? input.foto.trim() : null;

  const info = db
    .prepare(
      "INSERT INTO libros (titulo, editorial, foto, stock, precio) VALUES (?, ?, ?, ?, ?)",
    )
    .run(titulo, editorial, foto, input.stock, input.precio);

  return obtenerLibro(db, Number(info.lastInsertRowid))!;
}
