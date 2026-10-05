import { describe, expect, it } from "vitest";
import {
  applyDamage,
  createCombatant,
  getEffectiveAttributes,
  resolveBasicAttack,
  reworkOutgoingDamageMultiplier,
  reworkMovementAllowance,
  tickCooldowns,
} from "@/lib/game/combat";
import { resolveJrpgSkill } from "@/lib/game/jrpg-skill";
import { resolveTacticalSkill } from "@/lib/game/tactical-skill";

import { reworkClasses, reworkRaces } from "@/lib/game/rework-catalog";
import {
  getReworkBasicAttack,
  getReworkClassCombatSkills,
  getReworkRaceCombatSkills,
  getReworkSkillTargetReach,
} from "@/lib/game/rework-combat";

describe("contrato executável do combate Rework", () => {
  const fighter = (id: string) =>
    createCombatant({
      id,
      name: id,
      baseHp: 500,
      baseMana: 0,
      usesMana: false,
      attributes: { FOR: 100, INT: 100, DEF: 0, RES: 0, INI: 10, ARC: 100 },
    });
  it("converte todas as habilidades ativas de classe em operações táticas", () => {
    for (const entry of reworkClasses) {
      const skills = getReworkClassCombatSkills(entry, 100);
      expect(skills, entry.name).toHaveLength(4);
      expect(getReworkBasicAttack(entry), entry.name).not.toBeNull();
      for (const skill of skills) {
        expect(skill.operations.length, `${entry.name}: ${skill.name}`).toBeGreaterThan(0);
        expect(JSON.stringify(skill), `${entry.name}: ${skill.name}`).not.toContain('"ARC"');
      }
    }
  });

  it("converte os dois poderes ativos de cada raça sem atributo legado", () => {
    for (const entry of reworkRaces) {
      const skills = getReworkRaceCombatSkills(entry, 100);
      expect(skills, entry.name).toHaveLength(2);
      for (const skill of skills) {
        expect(skill.operations.length, `${entry.name}: ${skill.name}`).toBeGreaterThan(0);
        expect(JSON.stringify(skill), `${entry.name}: ${skill.name}`).not.toContain('"ARC"');
      }
    }
  });

  it("preserva alcance, área e recarga como valores válidos", () => {
    const skills = [
      ...reworkClasses.flatMap((entry) => getReworkClassCombatSkills(entry, 100)),
      ...reworkRaces.flatMap((entry) => getReworkRaceCombatSkills(entry, 100)),
    ];
    for (const skill of skills) {
      expect(skill.range).toBeGreaterThanOrEqual(0);
      expect(skill.area).toBeGreaterThanOrEqual(0);
      expect(skill.cooldown).toBeGreaterThanOrEqual(0);
    }
  });

  it("não envia habilidades ativas sem regra executável para o PvE tático", () => {
    const skills = [
      ...reworkClasses.flatMap((entry) => getReworkClassCombatSkills(entry, 100)),
      ...reworkClasses.flatMap((entry) =>
        entry.paths.flatMap((path) => getReworkClassCombatSkills(entry, 100, path.id)),
      ),
      ...reworkRaces.flatMap((entry) => getReworkRaceCombatSkills(entry, 100)),
    ];
    for (const skill of skills) {
      const actor = { ...fighter("actor"), hp: 300 };
      const target = { ...fighter("target"), hp: 400 };
      const result = resolveTacticalSkill(actor, target, skill);
      expect(result.event.kind, `${skill.key}: ${skill.name} — ${result.event.message}`).not.toBe(
        "error",
      );
    }
  });

  it("não perde efeitos fundamentais descritos no catálogo", () => {
    const skills = [
      ...reworkClasses.flatMap((entry) => getReworkClassCombatSkills(entry, 100)),
      ...reworkRaces.flatMap((entry) => getReworkRaceCombatSkills(entry, 100)),
    ];
    for (const skill of skills) {
      const description = skill.playerDescription.toLowerCase();
      const operations = new Set(skill.operations.map((operation) => operation.operation));
      if (/\bempurra\b/.test(description)) expect(operations.has("PUSH"), skill.name).toBe(true);
      if (/teleport/.test(description)) expect(operations.has("TELEPORT"), skill.name).toBe(true);
      if (/enra[ií]za|imobiliza|\bprende\b/.test(description))
        expect(operations.has("ROOT"), skill.name).toBe(true);
      if (/silencia|impede o uso da pr[oó]xima habilidade/.test(description))
        expect(operations.has("SILENCE"), skill.name).toBe(true);
      if (/remove (?:um )?(?:efeito|penalidade)/.test(description))
        expect(operations.has("REMOVE_STATUS"), skill.name).toBe(true);
    }
  });

  it("permite que uma área centrada no conjurador alcance alvos dentro do raio", () => {
    expect(getReworkSkillTargetReach({ range: 0, area: 2 })).toBe(2);
    expect(getReworkSkillTargetReach({ range: 0, area: 1 })).toBe(1);
    expect(getReworkSkillTargetReach({ range: 5, area: 2 })).toBe(5);
    const tiefling = reworkRaces.find((entry) => entry.id === "tiefling")!;
    const profanedGround = getReworkRaceCombatSkills(tiefling, 100).find(
      (entry) => entry.name === "Chão Profanado",
    )!;
    expect(profanedGround.area).toBe(1);
  });

  it("aplica redução real de dano no PvE tático e no PvP", () => {
    const barbarian = reworkClasses.find((entry) => entry.id === "barbaro")!;
    const skill = getReworkClassCombatSkills(barbarian, 100).find(
      (entry) => entry.name === "Pele de Guerra",
    )!;
    expect(skill.operations.some((operation) => operation.damageReductionPercent === 25)).toBe(
      true,
    );
    const tactical = resolveTacticalSkill(fighter("pve"), fighter("enemy"), skill);
    const versus = resolveJrpgSkill(fighter("pvp"), fighter("enemy"), skill);
    expect(tactical.actor.hp - applyDamage(tactical.actor, 100).hp).toBe(75);
    expect(versus.actor.hp - applyDamage(versus.actor, 100).hp).toBe(75);
  });

  it("remove penalidade e cura o aliado com Pó Restaurador", () => {
    const fairy = reworkRaces.find((entry) => entry.id === "fada")!;
    const skill = getReworkRaceCombatSkills(fairy, 100).find(
      (entry) => entry.name === "Pó Restaurador",
    )!;
    expect(skill.target).toBe("ally");
    const ally = {
      ...fighter("ally"),
      hp: 300,
      statuses: {
        poison: { name: "Veneno", duration: 2, stacks: 1, modifiers: {}, beneficial: false },
      },
    };
    const result = resolveJrpgSkill(fighter("fairy"), ally, skill);
    expect(result.target.hp - ally.hp).toBe(65);
    expect(result.target.statuses.poison).toBeUndefined();
    const tactical = resolveTacticalSkill(
      { ...fighter("fairy"), hp: 300, statuses: ally.statuses },
      fighter("enemy"),
      skill,
    );
    expect(tactical.actor.hp).toBe(365);
    expect(tactical.actor.statuses.poison).toBeUndefined();
    expect(tactical.target.hp).toBe(tactical.target.maxHp);
  });

  it("concede Escudo da Fé ao aliado em vez do próprio Paladino", () => {
    const paladin = reworkClasses.find((entry) => entry.id === "paladino")!;
    const skill = getReworkClassCombatSkills(paladin, 100).find(
      (entry) => entry.name === "Escudo da Fé",
    )!;
    expect(skill.target).toBe("ally");
    const result = resolveJrpgSkill(fighter("paladin"), fighter("ally"), skill);
    expect(result.actor.shield).toBe(0);
    expect(result.target.shield).toBeGreaterThan(0);
    const tactical = resolveTacticalSkill(fighter("paladin"), fighter("ally"), skill);
    expect(tactical.actor.shield).toBeGreaterThan(0);
    expect(tactical.target.shield).toBe(0);
  });

  it("cura Dreno Vital conforme HP efetivamente perdido pelo inimigo", () => {
    const vampire = reworkRaces.find((entry) => entry.id === "vampiro")!;
    const skill = getReworkRaceCombatSkills(vampire, 100).find(
      (entry) => entry.name === "Dreno Vital",
    )!;
    const actor = { ...fighter("vampire"), hp: 300 };
    const enemy = fighter("enemy");
    const jrpg = resolveJrpgSkill(actor, enemy, skill);
    const tactical = resolveTacticalSkill(actor, enemy, skill);
    expect(jrpg.actor.hp - actor.hp).toBe(Math.round((enemy.hp - jrpg.target.hp) * 0.5));
    expect(tactical.actor.hp - actor.hp).toBe(Math.round((enemy.hp - tactical.target.hp) * 0.5));

    const protectedEnemy = { ...enemy, shield: 100 };
    expect(resolveJrpgSkill(actor, protectedEnemy, skill).actor.hp).toBe(actor.hp);
    expect(resolveTacticalSkill(actor, protectedEnemy, skill).actor.hp).toBe(actor.hp);
  });

  it("Meditação de Combate cura 20% do HP máximo mais 40% de FOR no PvE e PvP", () => {
    const monk = reworkClasses.find((entry) => entry.id === "monge")!;
    const skill = getReworkClassCombatSkills(monk, 100).find(
      (entry) => entry.name === "Meditação de Combate",
    )!;
    const actor = {
      ...fighter("monk"),
      hp: 200,
      attributes: { ...fighter("monk").attributes, RES: 100 },
    };
    expect(skill.operations[0].healPercentOfMaxHp).toBe(20);
    const versus = resolveJrpgSkill(actor, fighter("enemy"), skill).actor;
    const tactical = resolveTacticalSkill(actor, fighter("enemy"), skill).actor;
    expect(versus.hp).toBe(340);
    expect(tactical.hp).toBe(340);
    expect(getEffectiveAttributes(versus).RES).toBe(120);
    expect(getEffectiveAttributes(tactical).RES).toBe(120);
    expect(versus.statuses["monge-4-resistencia"].duration).toBe(2);
    expect(tactical.statuses["monge-4-resistencia"].duration).toBe(2);
  });

  it("Recusar a Morte salva o Orc somente uma vez em ambos os motores", () => {
    const barbarian = reworkClasses.find((entry) => entry.id === "barbaro")!;
    const attack = getReworkBasicAttack(barbarian)!;
    const orc = { ...fighter("orc"), hp: 40, passiveKeys: ["orc-0"] };
    for (const resolve of [resolveJrpgSkill, resolveTacticalSkill]) {
      const first = resolve(fighter("attacker"), orc, attack).target;
      expect(first.hp).toBe(1);
      expect(first.passiveFlags?.orcDeathSaved).toBe(true);
      expect(first.statuses["orc-recusar-a-morte"].damageReductionPercent).toBe(25);
      expect(resolve(fighter("attacker"), first, attack).target.hp).toBe(0);
    }
  });

  it("Luz Celestial concede a barreira inicial do Aengel sem gastar uma ação", () => {
    const angel = createCombatant({
      id: "angel",
      name: "angel",
      baseHp: 500,
      baseMana: 0,
      usesMana: false,
      attributes: { FOR: 100, INT: 150, DEF: 0, RES: 0, INI: 10, ARC: 0 },
      passiveKeys: ["aengel-0"],
    });
    expect(angel.shield).toBe(160);
    expect(fighter("without-angel-passive").shield).toBe(0);
  });

  it("Escamas Ancestrais reduz somente o primeiro golpe recebido por rodada", () => {
    const dragon = { ...fighter("dragon"), passiveKeys: ["draconato-0"] };
    const first = applyDamage(dragon, 100);
    expect(first.hp).toBe(415);
    expect(first.passiveFlags?.draconatoFirstHitTaken).toBe(true);
    expect(applyDamage(first, 100).hp).toBe(315);
    expect(applyDamage(tickCooldowns(first), 100).hp).toBe(330);
  });

  it("Colheita de Almas reduz a recarga de Erguer Servo quando o alvo é derrotado", () => {
    const necromancer = {
      ...fighter("necromancer"),
      passiveKeys: ["necromante-0"],
      cooldowns: { "necromante-2": 3 },
    };
    const victim = { ...fighter("victim"), hp: 50 };
    const attack = getReworkBasicAttack(reworkClasses.find((entry) => entry.id === "necromante")!)!;
    for (const resolve of [resolveJrpgSkill, resolveTacticalSkill]) {
      const result = resolve(necromancer, victim, attack);
      expect(result.target.hp).toBe(0);
      expect(result.actor.cooldowns["necromante-2"]).toBe(2);
      const noHarvest = resolve(necromancer, fighter("healthy"), attack);
      expect(noHarvest.actor.cooldowns["necromante-2"]).toBe(3);
    }
  });

  it("Olho do Caçador aumenta o disparo apenas antes de se mover", () => {
    const archer = { ...fighter("archer"), passiveKeys: ["arqueiro-0"] };
    const target = fighter("target");
    expect(resolveBasicAttack(archer, target).event.amount).toBe(115);
    expect(
      resolveBasicAttack(archer, target, undefined, { movedBeforeAction: true }).event.amount,
    ).toBe(100);
    const shot = getReworkBasicAttack(reworkClasses.find((entry) => entry.id === "arqueiro")!)!;
    const stationary = resolveTacticalSkill(archer, target, shot);
    const moving = resolveTacticalSkill(archer, target, shot, undefined, {
      movedBeforeAction: true,
    });
    expect(stationary.event.amount).toBeGreaterThan(moving.event.amount);
  });

  it("Sentidos Milenares ignora 15% da defesa somente no primeiro ataque a cada inimigo", () => {
    const elf = { ...fighter("elf"), passiveKeys: ["elfo-0"] };
    const armored = {
      ...fighter("armored"),
      attributes: { ...fighter("armored").attributes, DEF: 100 },
    };
    const first = resolveBasicAttack(elf, armored);
    expect(first.event.amount).toBe(54);
    expect(first.actor.passiveFlags?.["elfo-first-hit:armored"]).toBe(true);
    expect(resolveBasicAttack(first.actor, armored).event.amount).toBe(50);
    expect(resolveBasicAttack(first.actor, { ...armored, id: "other" }).event.amount).toBe(54);
    const shot = getReworkBasicAttack(reworkClasses.find((entry) => entry.id === "arqueiro")!)!;
    const tactical = resolveTacticalSkill(elf, armored, shot);
    expect(tactical.actor.passiveFlags?.["elfo-first-hit:armored"]).toBe(true);
    expect(resolveTacticalSkill(tactical.actor, armored, shot).event.amount).toBeLessThan(
      tactical.event.amount,
    );
  });

  it("Corpo Feérico reduz dano de habilidades em área sem reduzir ataques individuais", () => {
    const fairy = { ...fighter("fairy"), passiveKeys: ["fada-0"] };
    const single = applyDamage(fairy, 100);
    const area = applyDamage(fairy, 100, { areaAttack: true });
    expect(single.hp).toBe(400);
    expect(area.hp).toBe(420);
    const attack = getReworkBasicAttack(reworkClasses.find((entry) => entry.id === "arqueiro")!)!;
    const areaAttack = { ...attack, area: 1 };
    expect(resolveTacticalSkill(fighter("enemy"), fairy, areaAttack).target.hp).toBeGreaterThan(
      resolveTacticalSkill(fighter("enemy"), fairy, attack).target.hp,
    );
  });

  it("Instinto do Alfa fixa o primeiro alvo danificado e aumenta dano e movimento contra ele", () => {
    const lion = { ...fighter("lion"), passiveKeys: ["leonis-0"] };
    const prey = fighter("prey");
    for (const resolve of [
      (a: ReturnType<typeof fighter>, b: ReturnType<typeof fighter>) => resolveBasicAttack(a, b),
      (a: ReturnType<typeof fighter>, b: ReturnType<typeof fighter>) =>
        resolveTacticalSkill(
          a,
          b,
          getReworkBasicAttack(reworkClasses.find((entry) => entry.id === "barbaro")!)!,
        ),
    ]) {
      const first = resolve(lion, prey);
      expect(first.actor.passiveMarkedTargetId).toBe("prey");
      expect(reworkMovementAllowance(first.actor, "prey", 4)).toBe(5);
      expect(reworkMovementAllowance(first.actor, "other", 4)).toBe(4);
      const second = resolve(first.actor, prey);
      expect(second.event.amount).toBeGreaterThan(first.event.amount);
      expect(resolve(first.actor, fighter("other")).event.amount).toBe(first.event.amount);
    }
  });

  it("Reflexo Enganador anula o próximo ataque e consome a ilusão", () => {
    const kitsune = reworkRaces.find((entry) => entry.id === "kitsune")!;
    const illusion = getReworkRaceCombatSkills(kitsune, 100).find(
      (skill) => skill.key === "kitsune-2",
    )!;
    for (const resolve of [resolveJrpgSkill, resolveTacticalSkill]) {
      const cast = resolve(fighter("kitsune"), fighter("enemy"), illusion);
      expect(cast.actor.statuses["kitsune-ilusao"]).toBeDefined();
      const blocked = resolveBasicAttack(fighter("enemy"), cast.actor);
      expect(blocked.target.hp).toBe(cast.actor.hp);
      expect(blocked.target.statuses["kitsune-ilusao"]).toBeUndefined();
      expect(resolveBasicAttack(fighter("enemy"), blocked.target).target.hp).toBeLessThan(
        cast.actor.hp,
      );
    }
  });

  it("Mãos Ligeiras remove um benefício real do alvo", () => {
    const rogue = reworkClasses.find((entry) => entry.id === "ladino")!;
    const dispel = getReworkClassCombatSkills(rogue, 100).find(
      (skill) => skill.key === "ladino-3",
    )!;
    const buffed = {
      ...fighter("enemy"),
      statuses: {
        protection: {
          name: "Proteção",
          duration: 2,
          stacks: 1,
          modifiers: { DEF: 20 },
          beneficial: true,
        },
      },
    };
    for (const resolve of [resolveJrpgSkill, resolveTacticalSkill]) {
      const result = resolve(fighter("rogue"), buffed, dispel);
      expect(result.target.statuses.protection).toBeUndefined();
    }
  });

  it("passivas ofensivas escalam dano real sem alterar personagens sem a passiva", () => {
    const target = fighter("target");
    const damagedBarbarian = { ...fighter("barbarian"), hp: 400, passiveKeys: ["barbaro-0"] };
    expect(reworkOutgoingDamageMultiplier(damagedBarbarian, target, "physical")).toBe(1.06);
    expect(resolveBasicAttack(damagedBarbarian, target).event.amount).toBe(106);

    const penalized = {
      ...target,
      statuses: {
        slow: { name: "Lentidão", duration: 1, stacks: 1, modifiers: {}, beneficial: false },
      },
    };
    const rogue = { ...fighter("rogue"), passiveKeys: ["ladino-0"] };
    expect(resolveBasicAttack(rogue, penalized).event.amount).toBe(115);
    expect(resolveBasicAttack(rogue, target).event.amount).toBe(100);

    const wolf = { ...fighter("wolf"), hp: 249, passiveKeys: ["lobisomem-0"] };
    expect(reworkOutgoingDamageMultiplier(wolf, target, "physical")).toBe(1.15);
    expect(reworkOutgoingDamageMultiplier(wolf, target, "magic")).toBe(1);
    const basicSkill = getReworkBasicAttack(
      reworkClasses.find((entry) => entry.id === "barbaro")!,
    )!;
    expect(resolveJrpgSkill(wolf, target, basicSkill).event.amount).toBeGreaterThan(
      resolveJrpgSkill(fighter("plain"), target, basicSkill).event.amount,
    );
    expect(resolveTacticalSkill(wolf, target, basicSkill).event.amount).toBeGreaterThan(
      resolveTacticalSkill(fighter("plain"), target, basicSkill).event.amount,
    );
  });

  it("Sede Carmesim cura dano direto com limite por rodada e zera no turno seguinte", () => {
    let actor: ReturnType<typeof fighter> = {
      ...fighter("vampire"),
      hp: 300,
      passiveKeys: ["vampiro-0"],
    };
    let target = fighter("target");
    for (let hit = 0; hit < 5; hit += 1) {
      const result = resolveBasicAttack(actor, target);
      actor = result.actor;
      target = result.target;
    }
    expect(actor.hp).toBe(340);
    expect(actor.passiveRoundHealing).toBe(40);
    const nextRound = resolveBasicAttack(tickCooldowns(actor), fighter("new-target"));
    expect(nextRound.actor.hp).toBe(350);
    const shielded = resolveBasicAttack(
      { ...fighter("shielded-vampire"), hp: 300, passiveKeys: ["vampiro-0"] },
      { ...fighter("shielded-target"), shield: 200 },
    );
    expect(shielded.actor.hp).toBe(300);
    const full = resolveBasicAttack(
      { ...fighter("full-vampire"), passiveKeys: ["vampiro-0"] },
      fighter("first-target"),
    ).actor;
    expect(full.passiveRoundHealing).toBe(0);
    expect(resolveBasicAttack({ ...full, hp: 300 }, fighter("second-target")).actor.hp).toBe(310);
  });

  it("Fera Desperta cura apenas pelo dano físico quando abaixo de metade da vida", () => {
    const wolf = { ...fighter("wolf"), hp: 200, passiveKeys: ["lobisomem-0"] };
    const skill = getReworkBasicAttack(reworkClasses.find((entry) => entry.id === "barbaro")!)!;
    const versus = resolveJrpgSkill(wolf, fighter("enemy"), skill);
    const tactical = resolveTacticalSkill(wolf, fighter("enemy"), skill);
    expect(versus.actor.hp).toBeGreaterThan(wolf.hp);
    expect(tactical.actor.hp).toBeGreaterThan(wolf.hp);
    expect(versus.actor.hp - wolf.hp).toBe(Math.round((500 - versus.target.hp) * 0.1));
    expect(tactical.actor.hp - wolf.hp).toBe(Math.round((500 - tactical.target.hp) * 0.1));
  });

  it("prende o alvo com Raízes do Primeiro Bosque", () => {
    const elf = reworkRaces.find((entry) => entry.id === "elfo")!;
    const skill = getReworkRaceCombatSkills(elf, 100).find(
      (entry) => entry.name === "Raízes do Primeiro Bosque",
    )!;
    expect(skill.operations.some((operation) => operation.operation === "ROOT")).toBe(true);
    const result = resolveTacticalSkill(fighter("elf"), fighter("target"), skill);
    expect(
      Object.values(result.target.statuses).some((status) => /ra[ií]z/i.test(status.name)),
    ).toBe(true);
  });
});
