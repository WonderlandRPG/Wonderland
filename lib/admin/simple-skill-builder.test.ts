import { describe, expect, it } from "vitest";
import { buildClassSkillFromSimpleDraft, simpleDraftDefaults } from "@/lib/admin/simple-skill-builder";

describe("simple admin skill builder", () => {
  it("builds a single target damage skill", () => {
    const skill = buildClassSkillFromSimpleDraft({ ...simpleDraftDefaults(), name: "Golpe Brutal", description: "Atinge um inimigo com um golpe pesado.", multiplier: 2, attribute: "FOR" });
    expect(skill.kind).toBe("damage");
    expect(skill.target).toBe("enemy");
    expect(skill.scaling[0]).toEqual({ attribute: "FOR", multiplier: 2 });
    expect(skill.operations[0].operation).toBe("DAMAGE");
  });

  it("builds an area heal capped by the selected target count", () => {
    const skill = buildClassSkillFromSimpleDraft({ ...simpleDraftDefaults(), name: "Luz Restauradora", description: "Restaura a vida de até três aliados escolhidos.", effectType: "heal", targetSide: "ally", targetCount: 3, attribute: "ARC", multiplier: 1.5, damageType: "none" });
    expect(skill.target).toBe("area");
    expect(skill.area).toBe(3);
    expect(skill.operations[0].target).toBe("ally");
    expect(skill.operations[0].operation).toBe("HEAL");
  });

  it("turns debuff values negative in the engine contract", () => {
    const skill = buildClassSkillFromSimpleDraft({ ...simpleDraftDefaults(), name: "Quebra-Guarda", description: "Enfraquece a defesa do inimigo por dois turnos.", effectType: "debuff", targetSide: "enemy", modifierAttribute: "DEF", modifierValue: 20, duration: 2, damageType: "none" });
    expect(skill.operations[0].operation).toBe("DEBUFF");
    expect(skill.operations[0].modifiers[0]).toEqual({ attribute: "DEF", value: -20 });
  });
});
