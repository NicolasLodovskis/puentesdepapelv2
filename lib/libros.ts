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

/** Orígenes posibles de un cambio de precio (RF-14). */
export type OrigenPrecio =
  | "edición manual"
  | "actualización masiva por Excel"
  | "alta por Excel";

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
