import { describe, expect, it } from "vitest";
import { createCombatant, resolveBasicAttack } from "@/lib/game/combat";

const target = () => createCombatant({
  id: "target",
  name: "Alvo",
  attributes: { FOR: 20, DEF: 20, RES: 20, INI: 20, INT: 20, ARC: 20 },
  baseHp: 1000,
  baseMana: 0,
  usesMana: false,
});

describe("basic attack class affinity", () => {
  it("keeps a physical class physical even when INT is higher than FOR", () => {
    const warrior = createCombatant({
      id: "warrior",
      name: "Guerreiro",
      attributes: { FOR: 40, DEF: 40, RES: 30, INI: 30, INT: 120, ARC: 20 },
      baseHp: 500,
      baseMana: 0,
      usesMana: false,
      basicAttackDamageType: "physical",
    });

    expect(resolveBasicAttack(warrior, target()).event.damageType).toBe("physical");
  });

  it("keeps a magical class magical even when FOR is higher than INT", () => {
    const mage = createCombatant({
      id: "mage",
      name: "Mago",
      attributes: { FOR: 120, DEF: 20, RES: 20, INI: 30, INT: 40, ARC: 50 },
      baseHp: 400,
      baseMana: 200,
      usesMana: true,
      basicAttackDamageType: "magic",
    });

    expect(resolveBasicAttack(mage, target()).event.damageType).toBe("magic");
  });
});
