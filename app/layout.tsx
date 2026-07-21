import type { Metadata } from "next";
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
      <body>{children}</body>
    </html>
  );
}
