import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(new URL("./202608090003_inventory.sql", import.meta.url), "utf8");

describe("migração do inventário", () => {
  it("não mistura uma variável composta com alvos escalares no SELECT INTO", () => {
    expect(migration).not.toMatch(/into\s+inventory_row\s*,/i);
  });

  it("usa a linha composta somente para devolver o item atualizado", () => {
    expect(migration.match(/returning\s+\*\s+into\s+inventory_row/gi)).toHaveLength(2);
    expect(migration).toContain(
      "into inventory_character_id, owner_id, character_level, item_slot, required_level",
    );
    expect(migration).toContain("into inventory_character_id, owner_id");
  });
});
