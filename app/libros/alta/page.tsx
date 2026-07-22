import Link from "next/link";
import { FormularioAlta } from "./formulario-alta";

export default function AltaLibrosPage() {
  return (
    <main>
      <p>
        <Link href="/" className="boton-volver">
          ← Volver al inicio
        </Link>
      </p>

      <h1>Alta de libros</h1>

      <FormularioAlta />
    </main>
  );
}
