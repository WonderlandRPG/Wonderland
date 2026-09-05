import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("PvE session lifecycle", () => {
  const page = readFileSync("app/arena/page.tsx", "utf8");
  const battle = readFileSync("components/arena/training-arena.tsx", "utf8");
  const actions = readFileSync("app/arena/actions.ts", "utf8");
  it("does not create paid entries while rendering or prefetching", () => {
    expect(page).not.toContain('rpc("v2_start_arena_session"');
    expect(actions).toContain('rpc("v2_start_arena_session"');
    expect(page).toContain("action={startPveAction}");
  });
  it("allows the last reserved session to be resumed", () => {
    expect(page).toContain("pveStatus?.remaining === 0 && !pveStatus.activeSessionId");
  });
  it("uses session identity to reset the battle and sends PvE back to the lobby", () => {
    expect(battle).toContain('sessionId ?? "training"');
    expect(battle).toContain("Voltar à Arena");
    expect(actions).not.toContain('revalidatePath("/arena")');
  });
});
