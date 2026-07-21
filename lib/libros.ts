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
