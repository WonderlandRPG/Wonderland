import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("PvE session lifecycle", () => {
  const page = readFileSync("app/arena/page.tsx", "utf8");
  const battle = readFileSync("components/arena/tactical-combat-shell.tsx", "utf8");
  const actions = readFileSync("app/arena/actions.ts", "utf8");
  it("does not create paid entries while rendering or prefetching", () => {
    expect(page).not.toContain('rpc("v2_start_arena_session"');
    expect(actions).toContain('rpc("v2_start_arena_session"');
    expect(page).toContain("action={startPveAction}");
  });
  it("allows the last reserved session to be resumed", () => {
    expect(page).toContain("pveStatus?.remaining === 0 && !pveStatus.activeSessionId");
  });
  it("usa somente o núcleo tático do Rework", () => {
    expect(battle).toContain("TacticalCombatCore");
    expect(page).not.toContain("modo=training");
    expect(page).not.toContain("/arena/dungeons");
    expect(page).not.toContain("/arena/mapa-tatico");
    expect(actions).not.toContain('revalidatePath("/arena")');
  });
});
