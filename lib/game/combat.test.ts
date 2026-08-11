import { describe, expect, it } from "vitest";

import { officialClasses } from "@/lib/game/official-classes";
import {
  applyDamage,
  calculateDamage,
  combineAttributes,
  createCombatant,
  deriveStats,
  getEffectiveAttributes,
  getConvertedResourceBonus,
  guardCombatant,
  resolveBasicAttack,
  resolveSkill,
  tickCooldowns,
} from "@/lib/game/combat";
import {
  applyBattleStartItemEffects,
  itemSpecialEffectSchema,
  resolvePeriodicItemDamage,
} from "@/lib/game/item-effects";

const attributes = { FOR: 100, DEF: 100, RES: 100, INI: 60, INT: 80, ARC: 70 };

describe("motor de combate", () => {
  it("aplica efeitos estruturados diferentes de itens no início da batalha", () => {
    const combatant = createCombatant({
      id: "item-test",
      name: "Aventureiro",
      attributes,
      baseHp: 400,
      baseMana: 100,
      classResource: { name: "Ímpeto", initial: 2, maximum: 10 },
      raceResource: { name: "Bravura", initial: 1, maximum: 5 },
    });
    const effect = itemSpecialEffectSchema.parse({
      key: "vigilia",
      name: "Vigília",
      description: "Concede vida, escudo e recursos no início da batalha.",
      trigger: "BATTLE_START",
      maxHpPercent: 10,
      shield: 25,
      mana: 20,
      classResource: 3,
      raceResource: 2,
    });
    const result = applyBattleStartItemEffects(combatant, [effect]);
    expect(result.maxHp).toBe(Math.round(combatant.maxHp * 1.1));
    expect(result.shield).toBe(25);
    expect(result.classResource).toBe(5);
    expect(result.raceResource).toBe(3);
  });
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

  it("Defender bloqueia integralmente o próximo dano e entra em recarga", () => {
    const target = createCombatant({
      id: "guardiao",
      name: "Guardião",
      attributes,
      baseHp: 300,
      baseMana: 0,
    });
    const guarded = guardCombatant(target);
    const blocked = applyDamage(guarded, 999);
    expect(blocked.hp).toBe(target.hp);
    expect(blocked.statuses["defesa-total"]).toBeUndefined();
    expect(guarded.cooldowns["defesa-total"]).toBe(5);
    expect(applyDamage(blocked, 50).hp).toBe(target.hp - 50);
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

  it("aplica Envenenamento na Arena e causa dano ao fim da rodada", () => {
    const poison = itemSpecialEffectSchema.parse({
      key: "gelo-verde",
      name: "Veneno Persistente",
      description: "Aplica Envenenamento.",
      kind: "POISON",
      trigger: "ON_DAMAGE_DEALT",
      duration: 3,
      power: 8,
    });
    const actor = createCombatant({
      id: "venenoso",
      name: "Ladino",
      attributes,
      baseHp: 300,
      baseMana: 0,
      itemEffects: [poison],
    });
    const target = createCombatant({
      id: "alvo-veneno",
      name: "Alvo",
      attributes,
      baseHp: 300,
      baseMana: 0,
    });
    const hit = resolveBasicAttack(actor, target);
    expect(Object.values(hit.target.statuses)[0]).toMatchObject({
      name: "Envenenamento",
      duration: 3,
      periodicDamage: 8,
    });
    expect(resolvePeriodicItemDamage(hit.target).combatant.hp).toBe(hit.target.hp - 8);
  });

  it("faz roubo de vida e reduz a recarga de habilidades por equipamento", () => {
    const lifeSteal = itemSpecialEffectSchema.parse({
      key: "sede-vital",
      name: "Sede Vital",
      description: "Recupera parte do dano causado.",
      kind: "LIFE_STEAL",
      trigger: "ON_DAMAGE_DEALT",
      power: 20,
    });
    const cooldown = itemSpecialEffectSchema.parse({
      key: "tempo-fraturado",
      name: "Tempo Fraturado",
      description: "Reduz recargas.",
      kind: "COOLDOWN_REDUCTION",
      trigger: "ON_SKILL_USE",
      power: 2,
    });
    const actor = {
      ...createCombatant({
        id: "vampirico",
        name: "Duelista",
        attributes,
        baseHp: 300,
        baseMana: 100,
        classResource: { name: "Carga Arcana", initial: 5, maximum: 5 },
        itemEffects: [lifeSteal, cooldown],
      }),
      hp: 300,
    };
    const target = createCombatant({
      id: "alvo-roubo",
      name: "Alvo",
      attributes,
      baseHp: 300,
      baseMana: 0,
    });
    expect(resolveBasicAttack(actor, target).actor.hp).toBe(310);
    const mage = officialClasses.find((entry) => entry.slug === "mago")!;
    const projectile = mage.payload.progression.find((skill) => skill.key === "projetil-arcano")!;
    expect(resolveSkill(actor, target, projectile).actor.cooldowns[projectile.key]).toBe(0);
  });

  it("aplica buffs nos atributos durante a duração cadastrada", () => {
    const actor = createCombatant({
      id: "barbaro",
      name: "Bárbaro",
      attributes,
      baseHp: 500,
      baseMana: 0,
      classResource: { name: "Fúria", initial: 100, maximum: 100 },
    });
    const target = createCombatant({
      id: "alvo",
      name: "Alvo",
      attributes,
      baseHp: 500,
      baseMana: 0,
    });
    const barbarian = officialClasses.find((entry) => entry.slug === "barbaro")!;
    const buff = barbarian.payload.paths
      .flatMap((path) => path.skills)
      .find((skill) => skill.key === "berserker-1")!;
    const result = resolveSkill(actor, target, buff);
    expect(getEffectiveAttributes(result.actor).FOR).toBe(attributes.FOR + 10);
    expect(Object.values(result.actor.statuses)[0]).toMatchObject({
      duration: 2,
      beneficial: true,
    });
    expect(getEffectiveAttributes(tickCooldowns(result.actor)).FOR).toBe(attributes.FOR + 10);
    expect(getEffectiveAttributes(tickCooldowns(tickCooldowns(result.actor))).FOR).toBe(
      attributes.FOR,
    );
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
