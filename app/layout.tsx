import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Puentes de Papel — Manejo de Stock",
  description: "Gestión de stock y precios de la librería Puentes de Papel",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <header className="cabecera">
          <Link href="/" aria-label="Inicio — Puentes de Papel">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-puentes-de-papel.jpg"
              alt="Puentes de Papel"
              className="logo"
            />
          </Link>
        </header>
        {children}
      </body>
    </html>
  );
}
