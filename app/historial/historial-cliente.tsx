"use client";

import { useEffect, useState } from "react";
import {
  filtrarHistorialPrecio,
  filtrarHistorialStock,
  filtrarHistorialVenta,
} from "./actions";
import type {
  EntradaHistorialPrecio,
  EntradaHistorialStock,
  EntradaHistorialVenta,
  FiltroHistorial,
} from "@/lib/historial";

type Tab = "precio" | "stock" | "ventas";

type Resultado =
  | { tipo: "precio"; filas: EntradaHistorialPrecio[] }
  | { tipo: "stock"; filas: EntradaHistorialStock[] }
  | { tipo: "ventas"; filas: EntradaHistorialVenta[] };

const TABS: { id: Tab; etiqueta: string }[] = [
  { id: "precio", etiqueta: "Precio" },
  { id: "stock", etiqueta: "Stock" },
  { id: "ventas", etiqueta: "Ventas" },
];

function formatearPrecio(precio: number): string {
  return precio.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
  });
}

/** Fecha local en formato `YYYY-MM-DD`. */
function isoLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dia}`;
}

export function HistorialCliente() {
  const [tab, setTab] = useState<Tab>("precio");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [titulo, setTitulo] = useState("");
  const [editorial, setEditorial] = useState("");
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [cargando, setCargando] = useState(false);

  // Defaults de fecha: desde = un mes atrás, hasta = hoy. Se setean en el
  // cliente (useEffect) para evitar desajustes de hidratación.
  useEffect(() => {
    const hoy = new Date();
    const mesAtras = new Date();
    mesAtras.setMonth(mesAtras.getMonth() - 1);
    setHasta(isoLocal(hoy));
    setDesde(isoLocal(mesAtras));
  }, []);

  // Al cambiar de tab se oculta el resultado: hay que volver a Buscar.
  function cambiarTab(nuevo: Tab) {
    if (nuevo === tab) return;
    setTab(nuevo);
    setResultado(null);
  }

  async function buscar(e: React.FormEvent) {
    e.preventDefault();
    const filtro: FiltroHistorial = { desde, hasta, titulo, editorial };
    setCargando(true);
    try {
      if (tab === "precio") {
        setResultado({ tipo: "precio", filas: await filtrarHistorialPrecio(filtro) });
      } else if (tab === "stock") {
        setResultado({ tipo: "stock", filas: await filtrarHistorialStock(filtro) });
      } else {
        setResultado({ tipo: "ventas", filas: await filtrarHistorialVenta(filtro) });
      }
    } finally {
      setCargando(false);
    }
  }

  return (
    <div>
      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={tab === t.id ? "tab tab-activo" : "tab"}
            onClick={() => cambiarTab(t.id)}
          >
            {t.etiqueta}
          </button>
        ))}
      </div>

      <form onSubmit={buscar} className="filtro-historial">
        <label>
          Desde
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
          />
        </label>
        <label>
          Hasta
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
          />
        </label>
        <label>
          Título
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
          />
        </label>
        <label>
          Editorial
          <input
            type="text"
            value={editorial}
            onChange={(e) => setEditorial(e.target.value)}
          />
        </label>
        <button type="submit" disabled={cargando}>
          {cargando ? "Buscando…" : "Buscar"}
        </button>
      </form>

      {resultado === null ? (
        <p>Presioná «Buscar» para ver el historial.</p>
      ) : (
        <Resultados resultado={resultado} />
      )}
    </div>
  );
}

function Resultados({ resultado }: { resultado: Resultado }) {
  if (resultado.filas.length === 0) {
    return <p>No hay registros para el filtro aplicado.</p>;
  }

  if (resultado.tipo === "precio") {
    return (
      <table className="tabla-libros">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Título</th>
            <th>Editorial</th>
            <th>Precio anterior</th>
            <th>Precio nuevo</th>
            <th>Origen</th>
          </tr>
        </thead>
        <tbody>
          {resultado.filas.map((e) => (
            <tr key={e.id}>
              <td>{e.fecha}</td>
              <td>{e.titulo}</td>
              <td>{e.editorial}</td>
              <td>{formatearPrecio(e.precio_anterior)}</td>
              <td>{formatearPrecio(e.precio_nuevo)}</td>
              <td>{e.origen}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (resultado.tipo === "stock") {
    return (
      <table className="tabla-libros">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Título</th>
            <th>Editorial</th>
            <th>Cantidad anterior</th>
            <th>Cantidad resultante</th>
            <th>Origen</th>
          </tr>
        </thead>
        <tbody>
          {resultado.filas.map((e) => (
            <tr key={e.id}>
              <td>{e.fecha}</td>
              <td>{e.titulo}</td>
              <td>{e.editorial}</td>
              <td>{e.cantidad_anterior}</td>
              <td>{e.cantidad_resultante}</td>
              <td>{e.origen}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <table className="tabla-libros">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Título</th>
          <th>Editorial</th>
          <th>Precio de venta</th>
        </tr>
      </thead>
      <tbody>
        {resultado.filas.map((e) => (
          <tr key={e.id}>
            <td>{e.fecha}</td>
            <td>{e.titulo}</td>
            <td>{e.editorial}</td>
            <td>{formatearPrecio(e.precio_venta)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
