import Link from "next/link";
import { HistorialCliente } from "./historial-cliente";

export default function HistorialPage() {
  return (
    <main>
      <p>
        <Link href="/" className="boton-volver">
          ← Volver al inicio
        </Link>
      </p>

      <h1>Historiales</h1>

      <HistorialCliente />
    </main>
  );
}
