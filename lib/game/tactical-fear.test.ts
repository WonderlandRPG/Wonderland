import { describe, expect, it } from "vitest";

import { chooseTacticalFleeDestination } from "@/lib/game/tactical-fear";
import { getTacticalDistance, tacticalPositionKey } from "@/lib/game/tactical-grid";

describe("tactical fear movement", () => {
  it("moves farther away from the threat", () => {
    const start = { x: 2, y: 2 };
    const threat = { x: 1, y: 2 };
    const result = chooseTacticalFleeDestination({
      start,
      threat,
      movement: 2,
      grid: { width: 6, height: 5 },
      blocked: new Set(),
    });

    expect(getTacticalDistance(result.position, threat)).toBeGreaterThan(
      getTacticalDistance(start, threat),
    );
  });

  it("never uses the threat cell or blocked cells", () => {
    const threat = { x: 1, y: 2 };
    const blocked = new Set(["3,2", "2,1", "2,3"]);
    const result = chooseTacticalFleeDestination({
      start: { x: 2, y: 2 },
      threat,
      movement: 3,
      grid: { width: 5, height: 5 },
      blocked,
    });

    expect(tacticalPositionKey(result.position)).not.toBe(tacticalPositionKey(threat));
    expect(blocked.has(tacticalPositionKey(result.position))).toBe(false);
  });
});
