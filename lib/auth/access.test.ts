import { describe, expect, it } from "vitest";

import { getAccessibleAccountAreas, getAccountNavigation } from "@/lib/auth/access";
import type { UserRole } from "@/lib/db/types";

function keysFor(role: UserRole) {
  return getAccessibleAccountAreas(role).map((area) => area.key);
}

describe("áreas disponíveis por cargo", () => {
  it.each(["player", "moderator"] satisfies UserRole[])(
    "não mostra o Painel ADM para %s",
    (role) => {
      expect(keysFor(role)).toEqual(["profile", "characters", "new-character", "arena"]);
    },
  );

  it.each(["admin", "founder"] satisfies UserRole[])("mostra o Painel ADM para %s", (role) => {
    expect(keysFor(role)).toContain("admin");
  });

  it("mantém a criação de personagem fora da navegação compacta", () => {
    expect(getAccountNavigation("player").map((area) => area.key)).toEqual([
      "profile",
      "characters",
      "arena",
    ]);
  });
});
