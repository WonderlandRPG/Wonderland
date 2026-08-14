import { describe, expect, it } from "vitest";
import { kingdoms } from "./kingdoms";
import { realmLore } from "./world-lore";

describe("atlas dos reinos", () => {
  it("publishes the six current kingdoms including Darkya", () => {
    expect(realmLore).toHaveLength(6);
    expect(realmLore.map((realm) => realm.key)).toEqual(
      expect.arrayContaining(["aokigahara", "darkya", "oymyakon", "lesedi", "namida", "skypiece"]),
    );
    expect(kingdoms.some((kingdom) => kingdom.key === "darkya")).toBe(true);
  });

  it("keeps architecture and resources where official information was provided", () => {
    const aokigahara = realmLore.find((realm) => realm.key === "aokigahara");
    expect(aokigahara?.architecture?.length).toBeGreaterThan(0);
    expect(aokigahara?.resources).toContain("Madeiras nobres");
  });
});
