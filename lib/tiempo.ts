/**
 * Expresión SQL para la fecha/hora actual en **UTC-3** (hora de Argentina).
 *
 * `datetime('now')` de SQLite devuelve UTC; restamos 3 horas para persistir
 * todas las fechas en UTC-3. Argentina no aplica horario de verano, así que el
 * offset es fijo.
 */
export const SQL_AHORA_UTC3 = "datetime('now', '-3 hours')";
