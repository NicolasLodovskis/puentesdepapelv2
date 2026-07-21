import { describe, it, expect } from "vitest";
import Database from "better-sqlite3";

describe("smoke", () => {
  it("vitest corre", () => {
    expect(1 + 1).toBe(2);
  });

  it("better-sqlite3 abre una base en memoria", () => {
    const db = new Database(":memory:");
    const row = db.prepare("select 1 + 1 as n").get() as { n: number };
    expect(row.n).toBe(2);
    db.close();
  });
});
