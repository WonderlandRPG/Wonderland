import { describe, expect, it } from "vitest";

import { createEmptyClassSkill } from "@/lib/game/classes";
import {
  applySkillBalanceOverride,
  isTalentTreeSelectionValid,
  resolveSkillLoadout,
} from "@/lib/game/skill-loadout";

describe("skill loadout", () => {
  const available = {
    classSkillKeys: ["a", "b"],
    raceSkillKeys: ["r"],
    passiveKeys: ["p"],
    talentKeys: ["t1", "t2", "t3"],
  };

  it("preserves every unlocked option when the character has no saved loadout", () => {
    expect(resolveSkillLoadout(null, available)).toEqual({
      classSkillKeys: ["a", "b"],
      raceSkillKeys: ["r"],
      passiveKeys: ["p"],
      talentKeys: ["t1", "t2", "t3"],
      persisted: false,
    });
  });

  it("removes stale keys from a saved loadout", () => {
    expect(
      resolveSkillLoadout(
        {
          equipped_class_skill_keys: ["a", "removed"],
          equipped_race_skill_keys: ["r"],
          selected_passive_keys: ["p", "removed"],
          selected_talent_keys: ["t1"],
        },
        available,
      ),
    ).toMatchObject({ classSkillKeys: ["a"], passiveKeys: ["p"], persisted: true });
  });

  it("requires talent nodes to be selected in tree order", () => {
    expect(isTalentTreeSelectionValid(["t1", "t2"], available.talentKeys)).toBe(true);
    expect(isTalentTreeSelectionValid(["t1", "t3"], available.talentKeys)).toBe(false);
  });

  it("applies administrative buffs and nerfs to the executable skill", () => {
    const skill = {
      ...createEmptyClassSkill(),
      key: "impacto",
      cost: 4,
      cooldown: 3,
      range: 2,
      operations: [
        {
          ...createEmptyClassSkill().operations[0],
          base: 20,
          modifiers: [{ attribute: "FOR" as const, value: 10 }],
        },
      ],
    };
    const balanced = applySkillBalanceOverride(skill, {
      impacto: {
        powerMultiplier: 1.5,
        cooldownDelta: 1,
        rangeDelta: 2,
        areaDelta: 0,
        costDelta: -1,
        disabled: false,
      },
    });
    expect(balanced).toMatchObject({ cost: 3, cooldown: 4, range: 4 });
    expect(balanced?.operations[0].base).toBe(30);
    expect(balanced?.operations[0].modifiers[0].value).toBe(15);
  });
});
