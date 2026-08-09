import { describe, expect, it } from "vitest";

import { officialClasses } from "@/lib/game/official-classes";
import {
  applyDamage,
  calculateDamage,
  combineAttributes,
  createCombatant,
  deriveStats,
  getConvertedResourceBonus,
  resolveBasicAttack,
  resolveSkill,
  tickCooldowns,
} from "@/lib/game/combat";

const attributes = { FOR: 100, DEF: 100, RES: 100, INI: 60, INT: 80, ARC: 70 };

describe("motor de combate", () => {
  it("deriva HP, Mana e poderes a partir dos atributos", () => {
    expect(deriveStats(attributes, 300, 100)).toEqual({
      maxHp: 800,
      maxMana: 340,
      initiative: 60,
      physicalPower: 100,
      magicalPower: 80,
      supportPower: 70,
    });
  });

  it("mitiga dano físico e mágico, mas não dano verdadeiro", () => {
    expect(calculateDamage(100, "physical", attributes)).toBe(50);
    expect(calculateDamage(100, "magic", attributes)).toBe(50);
    expect(calculateDamage(100, "true", attributes)).toBe(100);
  });

  it("converte o potencial de Mana em recurso inicial quando a ficha não usa Mana", () => {
    expect(getConvertedResourceBonus(20, 5)).toBe(1);
    expect(getConvertedResourceBonus(80, 100)).toBe(20);
    const fighter = createCombatant({
      id: "fighter",
      name: "Guerreiro Leonis",
      attributes: { ...attributes, INT: 20 },
      baseHp: 400,
      baseMana: 70,
      usesMana: false,
      classResource: { name: "Ímpeto", initial: 0, maximum: 100 },
      raceResource: { name: "Bravura", initial: 0, maximum: 5 },
    });
    expect(fighter.maxMana).toBe(0);
    expect(fighter.classResource).toBe(5);
    expect(fighter.raceResource).toBe(1);
  });

  it("consome escudo antes do HP", () => {
    const target = {
      ...createCombatant({ id: "a", name: "Alvo", attributes, baseHp: 300, baseMana: 0 }),
      shield: 40,
    };
    const next = applyDamage(target, 75);
    expect(next.shield).toBe(0);
    expect(next.hp).toBe(target.maxHp - 35);
  });

  it("resolve ataque básico, habilidade, Mana e recarga", () => {
    const actor = createCombatant({
      id: "a",
      name: "Herói",
      attributes,
      baseHp: 300,
      baseMana: 100,
      classResource: { name: "Carga Arcana", initial: 5, maximum: 5 },
    });
    const target = createCombatant({
      id: "b",
      name: "Boneco",
      attributes,
      baseHp: 300,
      baseMana: 0,
    });
    expect(resolveBasicAttack(actor, target).target.hp).toBe(target.maxHp - 50);
    const mage = officialClasses.find((entry) => entry.slug === "mago")!;
    const projectile = mage.payload.progression.find((skill) => skill.key === "projetil-arcano")!;
    const resolution = resolveSkill(actor, target, projectile);
    expect(resolution.actor.classResource).toBe(actor.classResource - 1);
    expect(resolution.actor.cooldowns[projectile.key]).toBe(1);
    expect(resolution.target.hp).toBeLessThan(target.hp);
    expect(resolveSkill(resolution.actor, resolution.target, projectile).event.kind).toBe("error");
    expect(tickCooldowns(resolution.actor).cooldowns[projectile.key]).toBe(0);
  });

  it("combina base, pontos livres e bônus raciais", () => {
    expect(combineAttributes({ FOR: 20, DEF: 20 }, { FOR: 50 }, { FOR: 5, RES: 3 })).toEqual({
      FOR: 75,
      DEF: 20,
      RES: 3,
      INI: 0,
      INT: 0,
      ARC: 0,
    });
  });
});
