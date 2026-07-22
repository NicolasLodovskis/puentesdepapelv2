"use server";

import { getDb } from "@/lib/db";
import {
  listarHistorialPrecio,
  listarHistorialStock,
  listarHistorialVenta,
  type FiltroHistorial,
  type EntradaHistorialPrecio,
  type EntradaHistorialStock,
  type EntradaHistorialVenta,
} from "@/lib/historial";

/** Devuelve el historial de precio filtrado (RF-16). */
export async function filtrarHistorialPrecio(
  filtro: FiltroHistorial,
): Promise<EntradaHistorialPrecio[]> {
  return listarHistorialPrecio(getDb(), filtro);
}

/** Devuelve el historial de stock filtrado (RF-16). */
export async function filtrarHistorialStock(
  filtro: FiltroHistorial,
): Promise<EntradaHistorialStock[]> {
  return listarHistorialStock(getDb(), filtro);
}

/** Devuelve el historial de ventas filtrado (RF-16). */
export async function filtrarHistorialVenta(
  filtro: FiltroHistorial,
): Promise<EntradaHistorialVenta[]> {
  return listarHistorialVenta(getDb(), filtro);
}
