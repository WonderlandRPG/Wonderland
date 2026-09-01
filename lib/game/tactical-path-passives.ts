import type { ClassSkill } from "@/lib/game/classes";
import {
  applyDamage,
  getEffectiveAttributes,
  type CombatantState,
  type DamageType,
} from "@/lib/game/combat";

export type TacticalPathTracker = {
  lastCategory: string | null;
  lastElement: string | null;
  precisionStacks: number;
  comboStacks: number;
  firstSupportUsed: boolean;
  firstControlUsed: boolean;
  firstHealUsed: boolean;
  freeItemUsed: boolean;
  movedThisTurn: boolean;
  guardianUsedThisRound: boolean;
  vengeanceReady: boolean;
  darkKnightReady: boolean;
  warClericReady: boolean;
  transmuterCategories: string[];
  shinobiBonusUsedThisRound: boolean;
  sealRefundUsedThisRound: boolean;
  summonBonusUsedThisRound: boolean;
};

export const initialTacticalPathTracker: TacticalPathTracker = {
  lastCategory: null,
  lastElement: null,
  precisionStacks: 0,
  comboStacks: 0,
  firstSupportUsed: false,
  firstControlUsed: false,
  firstHealUsed: false,
  freeItemUsed: false,
  movedThisTurn: false,
  guardianUsedThisRound: false,
  vengeanceReady: false,
  darkKnightReady: false,
  warClericReady: false,
  transmuterCategories: [],
  shinobiBonusUsedThisRound: false,
  sealRefundUsedThisRound: false,
  summonBonusUsedThisRound: false,
};

export type TacticalPathActionContext = {
  skill?: ClassSkill;
  successfulOperationIndexes?: number[];
  dealtDamage?: number;
  damageType?: DamageType;
  distance?: number;
  targetMarked?: boolean;
  movedBeforeAction?: boolean;
  healed?: number;
  shieldGranted?: number;
  classResourceBefore?: number;
  classResourceAfterCost?: number;
};

function normalize(value: string | null | undefined) {
  return (value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function pathIs(pathKey: string | null | undefined, expected: string) {
  return normalize(pathKey) === normalize(expected);
}

function successfulOperations(skill: ClassSkill | undefined, indexes: number[] | undefined) {
  if (!skill) return [];
  if (!indexes) return skill.operations;
  const success = new Set(indexes);
  return skill.operations.filter((_, index) => success.has(index));
}

function isSupport(skill: ClassSkill | undefined) {
  return Boolean(
    skill?.operations.some((operation) =>
      ["HEAL", "SHIELD", "BUFF", "REMOVE_STATUS"].includes(operation.operation),
    ),
  );
}

function isControl(skill: ClassSkill | undefined) {
  return Boolean(
    skill?.operations.some((operation) =>
      ["DEBUFF", "APPLY_STATUS", "STUN", "ROOT", "SILENCE", "FEAR", "TAUNT"].includes(
        operation.operation,
      ),
    ),
  );
}

function isTransformation(skill: ClassSkill | undefined) {
  const text = `${skill?.category ?? ""} ${skill?.name ?? ""} ${skill?.effect ?? ""}`.toLowerCase();
  return /transform|forma|avatar|ascens|despert|manto|transe|frenesi|soberan/.test(text);
}

function inferElement(skill: ClassSkill | undefined) {
  const text = `${skill?.name ?? ""} ${skill?.effect ?? ""} ${skill?.playerDescription ?? ""}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const elements: Array<[string, RegExp]> = [
    ["fogo", /fogo|chama|infernal|incendi|brasas/],
    ["gelo", /gelo|geada|congel|glacial/],
    ["raio", /raio|trovao|eletric|relamp/],
    ["terra", /terra|pedra|rocha|raiz/],
    ["agua", /agua|mar|onda|aquat/],
    ["vento", /vento|ar |tempest|furacao/],
    ["arcano", /arcano|magia pura|eter|void|abismo/],
  ];
  return elements.find(([, pattern]) => pattern.test(text))?.[0] ?? skill?.damageType ?? "none";
}

function multiplyOperationPower(skill: ClassSkill, operationNames: string[], multiplier: number) {
  return {
    ...skill,
    operations: skill.operations.map((operation) =>
      operationNames.includes(operation.operation)
        ? {
            ...operation,
            base: Math.round(operation.base * multiplier),
            scaling: operation.scaling.map((entry) => ({
              ...entry,
              multiplier: Number((entry.multiplier * multiplier).toFixed(3)),
            })),
            modifiers: operation.modifiers.map((modifier) => ({
              ...modifier,
              value: Math.round(modifier.value * multiplier),
            })),
          }
        : operation,
    ),
  };
}

function extendOperationDuration(skill: ClassSkill, operationNames: string[], turns: number) {
  return {
    ...skill,
    operations: skill.operations.map((operation) =>
      operationNames.includes(operation.operation) && operation.duration > 0
        ? { ...operation, duration: operation.duration + turns }
        : operation,
    ),
  };
}

function addStatus(
  combatant: CombatantState,
  key: string,
  name: string,
  modifiers: Partial<Record<keyof CombatantState["attributes"], number>>,
  duration = 1,
) {
  return {
    ...combatant,
    statuses: {
      ...combatant.statuses,
      [key]: {
        name,
        duration,
        stacks: 1,
        modifiers,
        beneficial: true,
      },
    },
  };
}

function addClassResource(combatant: CombatantState, amount: number) {
  const next = Math.min(combatant.maxClassResource, combatant.classResource + Math.max(0, amount));
  const gained = next - combatant.classResource;
  return { combatant: gained ? { ...combatant, classResource: next } : combatant, gained };
}

function applyBonusDamage(target: CombatantState, dealtDamage: number, percent: number) {
  const bonus = Math.max(0, Math.round(dealtDamage * percent));
  if (!bonus) return { target, bonus: 0 };
  const damaged = applyDamage(target, bonus);
  return {
    target: damaged,
    bonus: target.hp + target.shield - (damaged.hp + damaged.shield),
  };
}

export function markTacticalPathMovement(tracker: TacticalPathTracker, moved: boolean) {
  return moved ? { ...tracker, movedThisTurn: true } : tracker;
}

export function resetTacticalPathRound(tracker: TacticalPathTracker) {
  return {
    ...tracker,
    firstSupportUsed: false,
    firstHealUsed: false,
    movedThisTurn: false,
    guardianUsedThisRound: false,
    shinobiBonusUsedThisRound: false,
    sealRefundUsedThisRound: false,
    summonBonusUsedThisRound: false,
  };
}

export function prepareTacticalPathSkill({
  pathKey,
  tracker,
  actor,
  target,
  skill,
}: {
  pathKey: string | null | undefined;
  tracker: TacticalPathTracker;
  actor: CombatantState;
  target: CombatantState;
  skill: ClassSkill;
}) {
  let prepared = skill;
  const messages: string[] = [];

  if (pathIs(pathKey, "comandante") && !tracker.firstSupportUsed && isSupport(skill)) {
    prepared = multiplyOperationPower(prepared, ["HEAL", "SHIELD", "BUFF"], 1.2);
    messages.push("Doutrina Comandante: primeiro suporte da rodada +20%.");
  }

  if (pathIs(pathKey, "juramento-da-luz") && target.hp < target.maxHp) {
    prepared = multiplyOperationPower(prepared, ["SHIELD"], 1.2);
    if (prepared !== skill) messages.push("Juramento da Luz: escudo em alvo ferido +20%.");
  }

  if (pathIs(pathKey, "dominio-da-vida") && !tracker.firstHealUsed) {
    prepared = multiplyOperationPower(prepared, ["HEAL"], 1.2);
    if (prepared !== skill) messages.push("Domínio da Vida: primeira cura da rodada +20%.");
  }

  if (pathIs(pathKey, "circulo-da-terra")) {
    prepared = extendOperationDuration(
      prepared,
      ["DEBUFF", "APPLY_STATUS", "STUN", "ROOT", "SILENCE", "FEAR", "TAUNT"],
      1,
    );
  }

  if (pathIs(pathKey, "colegio-do-glamour") && !tracker.firstControlUsed && isControl(skill)) {
    prepared = {
      ...prepared,
      operations: prepared.operations.map((operation) =>
        ["DEBUFF", "APPLY_STATUS", "STUN", "ROOT", "SILENCE", "FEAR", "TAUNT"].includes(
          operation.operation,
        )
          ? { ...operation, chance: Math.min(100, operation.chance + 20) }
          : operation,
      ),
    };
    messages.push("Colégio do Glamour: primeiro controle do combate +20 p.p. de chance.");
  }

  if (pathIs(pathKey, "cirurgiao-quimico") && target.hp < target.maxHp && isSupport(skill)) {
    prepared = extendOperationDuration(prepared, ["BUFF", "APPLY_STATUS", "SUMMON"], 1);
    prepared = multiplyOperationPower(prepared, ["HEAL", "SHIELD"], 1.15);
    messages.push("Cirurgião Químico: suporte em alvo ferido prolongado/reforçado.");
  }

  return { skill: prepared, messages };
}

export function applyTacticalPathAfterAction({
  pathKey,
  tracker,
  actorBefore,
  targetBefore,
  actorAfter,
  targetAfter,
  context,
}: {
  pathKey: string | null | undefined;
  tracker: TacticalPathTracker;
  actorBefore: CombatantState;
  targetBefore: CombatantState;
  actorAfter: CombatantState;
  targetAfter: CombatantState;
  context: TacticalPathActionContext;
}) {
  let actor = actorAfter;
  let target = targetAfter;
  let next = { ...tracker };
  const messages: string[] = [];
  const dealt = Math.max(0, context.dealtDamage ?? 0);
  const operations = successfulOperations(context.skill, context.successfulOperationIndexes);
  const physical = context.damageType === "physical";
  const magic = context.damageType === "magic";

  const bonusDamage = (percent: number, reason: string) => {
    const result = applyBonusDamage(target, dealt, percent);
    target = result.target;
    if (result.bonus > 0) messages.push(`${reason}: +${result.bonus} dano.`);
  };

  if (pathIs(pathKey, "berserker") && physical && dealt > 0 && actor.classResource > actor.maxClassResource / 2) {
    bonusDamage(0.15, "Berserker");
  }

  if (pathIs(pathKey, "mestre-de-armas") && context.skill && dealt > 0) {
    if (next.lastCategory && normalize(next.lastCategory) !== normalize(context.skill.category)) {
      actor = {
        ...actor,
        cooldowns: Object.fromEntries(
          Object.entries(actor.cooldowns).map(([key, value]) => [
            key,
            key === context.skill?.key ? value : Math.max(0, value - 1),
          ]),
        ),
      };
      messages.push("Mestre de Armas: alternância reduziu outras recargas em 1.");
    }
  }

  if (pathIs(pathKey, "juramento-da-vinganca") && next.vengeanceReady && dealt > 0) {
    bonusDamage(0.15, "Juramento da Vingança");
    next.vengeanceReady = false;
  }

  if (pathIs(pathKey, "cavaleiro-negro") && next.darkKnightReady && physical && dealt > 0) {
    bonusDamage(0.15, "Cavaleiro Negro");
    next.darkKnightReady = false;
  }

  if (pathIs(pathKey, "atirador") && dealt > 0 && (context.distance ?? 0) >= 3) {
    if (next.precisionStacks > 0) bonusDamage(next.precisionStacks * 0.05, "Precisão acumulada");
    next.precisionStacks = Math.min(3, next.precisionStacks + 1);
    messages.push(`Atirador: Precisão ${next.precisionStacks}/3.`);
  }

  if (pathIs(pathKey, "executor") && dealt > 0 && targetBefore.hp < targetBefore.maxHp * 0.35) {
    bonusDamage(0.2, "Executor");
  }

  if (pathIs(pathKey, "sombra") && next.movedThisTurn && dealt > 0) {
    bonusDamage(0.15, "Sombra");
    next.movedThisTurn = false;
  }

  if (pathIs(pathKey, "punho-de-ferro")) {
    if (dealt > 0) {
      if (next.comboStacks > 0) bonusDamage(next.comboStacks * 0.1, "Punho de Ferro");
      next.comboStacks = Math.min(3, next.comboStacks + 1);
      messages.push(`Punho de Ferro: combo ${next.comboStacks}/3.`);
    } else if (context.skill) {
      next.comboStacks = 0;
    }
  }

  if (
    pathIs(pathKey, "caminho-espiritual") &&
    context.skill &&
    isSupport(context.skill) &&
    (context.classResourceBefore ?? actorBefore.classResource) >
      (context.classResourceAfterCost ?? actorAfter.classResource)
  ) {
    const amount = Math.max(1, Math.round(actor.maxHp * 0.05));
    const healed = Math.min(amount, actor.maxHp - actor.hp);
    actor = { ...actor, hp: actor.hp + healed };
    if (healed) messages.push(`Caminho Espiritual: +${healed} HP.`);
  }

  if (pathIs(pathKey, "elementalista") && dealt > 0 && context.skill) {
    const element = inferElement(context.skill);
    if (next.lastElement && next.lastElement !== element) bonusDamage(0.15, "Reação Elemental");
    next.lastElement = element;
  }

  if (pathIs(pathKey, "linhagem-draconica") && context.skill && inferElement(context.skill) !== "none") {
    actor = addStatus(actor, "doutrina-linhagem-draconica", "Resistência Dracônica", { RES: 10 }, 1);
    messages.push("Linhagem Dracônica: +10 RES por 1 turno.");
  }

  if (pathIs(pathKey, "caos-arcano") && context.skill) {
    const success = new Set(context.successfulOperationIndexes ?? []);
    const lucky = context.skill.operations.some((operation, index) => operation.chance < 100 && success.has(index));
    if (lucky) {
      actor = addStatus(actor, "doutrina-caos-arcano", "Caos Favorável", { INT: 10 }, 1);
      messages.push("Caos Arcano: +10 INT por 1 turno.");
    }
  }

  if (
    pathIs(pathKey, "pacto-infernal") &&
    magic &&
    dealt > 0 &&
    Object.values(targetBefore.statuses).some((status) => !status.beneficial)
  ) {
    bonusDamage(0.15, "Pacto Infernal");
  }

  if (pathIs(pathKey, "pacto-abissal") && isControl(context.skill) && operations.length > 0) {
    const resource = addClassResource(actor, 1);
    actor = resource.combatant;
    if (resource.gained) messages.push(`Pacto Abissal: +${resource.gained} ${actor.classResourceName}.`);
  }

  if (pathIs(pathKey, "dominio-da-guerra") && (context.healed ?? 0) > 0) {
    next.warClericReady = true;
    messages.push("Domínio da Guerra: próximo dano fortalecido.");
  }
  if (pathIs(pathKey, "dominio-da-guerra") && next.warClericReady && dealt > 0) {
    bonusDamage(0.15, "Domínio da Guerra");
    next.warClericReady = false;
  }

  if (pathIs(pathKey, "circulo-da-lua") && isTransformation(context.skill)) {
    actor = {
      ...actor,
      statuses: Object.fromEntries(
        Object.entries(actor.statuses).map(([key, status]) => [
          key,
          status.beneficial && (status.modifiers.DEF || status.modifiers.RES)
            ? { ...status, duration: status.duration + 1 }
            : status,
        ]),
      ),
    };
    messages.push("Círculo da Lua: efeitos defensivos preservados por +1 turno.");
  }

  if (pathIs(pathKey, "colegio-da-guerra") && isSupport(context.skill) && operations.length > 0) {
    actor = addStatus(actor, "doutrina-colegio-guerra", "Marcha do Colégio", { FOR: 10, INT: 10 }, 1);
    messages.push("Colégio da Guerra: +10 FOR e +10 INT por 1 turno.");
  }

  if (pathIs(pathKey, "mestre-transmutador") && context.skill && operations.length > 0) {
    const category = normalize(context.skill.category);
    const categories = new Set(next.transmuterCategories);
    categories.add(category);
    if (categories.size >= 3) {
      const resource = addClassResource(actor, 1);
      actor = resource.combatant;
      next.transmuterCategories = [];
      if (resource.gained) messages.push(`Mestre Transmutador: +${resource.gained} ${actor.classResourceName}.`);
    } else {
      next.transmuterCategories = [...categories];
    }
  }

  if (
    pathIs(pathKey, "shinobi") &&
    (context.movedBeforeAction || next.movedThisTurn) &&
    dealt > 0 &&
    !next.shinobiBonusUsedThisRound
  ) {
    const resource = addClassResource(actor, 1);
    actor = resource.combatant;
    next.shinobiBonusUsedThisRound = true;
    if (resource.gained) messages.push(`Shinobi: limite ampliado, +${resource.gained} ${actor.classResourceName}.`);
  }

  if (
    pathIs(pathKey, "mestre-dos-selos") &&
    context.targetMarked &&
    isControl(context.skill) &&
    operations.length > 0 &&
    !next.sealRefundUsedThisRound
  ) {
    const resource = addClassResource(actor, 1);
    actor = resource.combatant;
    next.sealRefundUsedThisRound = true;
    if (resource.gained) messages.push(`Mestre dos Selos: +${resource.gained} ${actor.classResourceName}.`);
  }

  if (
    pathIs(pathKey, "pastor-do-veu") &&
    (context.classResourceBefore ?? 0) > 0 &&
    (context.classResourceAfterCost ?? actorAfter.classResource) === 0
  ) {
    const arc = getEffectiveAttributes(actor).ARC;
    const shield = Math.max(1, Math.round(arc * 0.5));
    actor = { ...actor, shield: actor.shield + shield };
    messages.push(`Pastor do Véu: +${shield} escudo ao consumir a última Alma.`);
  }

  if (context.skill) {
    next.lastCategory = context.skill.category;
    if (isSupport(context.skill)) next.firstSupportUsed = true;
    if (context.skill.operations.some((operation) => operation.operation === "HEAL")) next.firstHealUsed = true;
    if (isControl(context.skill)) next.firstControlUsed = true;
  }

  return { actor, target, tracker: next, messages };
}

export function applyTacticalPathIncoming({
  pathKey,
  tracker,
  before,
  after,
  basicAttack = false,
}: {
  pathKey: string | null | undefined;
  tracker: TacticalPathTracker;
  before: CombatantState;
  after: CombatantState;
  basicAttack?: boolean;
}) {
  let combatant = after;
  let next = { ...tracker };
  const messages: string[] = [];
  const hpLost = Math.max(0, before.hp - after.hp);
  const durabilityLost = Math.max(0, before.hp + before.shield - (after.hp + after.shield));

  if (pathIs(pathKey, "guardiao-totemico") && durabilityLost >= before.maxHp * 0.1 && !next.guardianUsedThisRound) {
    const shield = Math.max(1, Math.round(before.maxHp * 0.1));
    combatant = { ...combatant, shield: combatant.shield + shield };
    next.guardianUsedThisRound = true;
    messages.push(`Guardião Totêmico: +${shield} escudo.`);
  }

  if (pathIs(pathKey, "juramento-da-vinganca") && durabilityLost > 0) next.vengeanceReady = true;

  if (pathIs(pathKey, "bastiao") && before.shield > 0 && durabilityLost > 0) {
    const restored = Math.max(1, Math.round(durabilityLost * 0.1));
    combatant = { ...combatant, hp: Math.min(combatant.maxHp, combatant.hp + restored) };
    messages.push(`Bastião: mitigou ${restored} dano enquanto protegido.`);
  }

  if (pathIs(pathKey, "cavaleiro-negro") && hpLost > 0) next.darkKnightReady = true;

  if (pathIs(pathKey, "duelista") && basicAttack && durabilityLost > 0) {
    const evaded = Math.max(1, Math.round(durabilityLost * 0.15));
    combatant = { ...combatant, hp: Math.min(combatant.maxHp, combatant.hp + evaded) };
    next.darkKnightReady = false;
    next.vengeanceReady = next.vengeanceReady;
    combatant = addStatus(combatant, "doutrina-duelista", "Resposta do Duelista", { INI: 10 }, 1);
    messages.push(`Duelista: esquiva tática mitigou ${evaded} e habilitou +10 INI.`);
  }

  return { combatant, tracker: next, messages };
}

export function applyTacticalPathTurnEnd({
  pathKey,
  tracker,
  combatant,
}: {
  pathKey: string | null | undefined;
  tracker: TacticalPathTracker;
  combatant: CombatantState;
}) {
  let actor = combatant;
  const messages: string[] = [];

  if (pathIs(pathKey, "arcanista") && actor.classResource > 0) {
    const shield = Math.max(1, Math.round(getEffectiveAttributes(actor).INT * 0.3));
    actor = { ...actor, shield: actor.shield + shield };
    messages.push(`Arcanista: +${shield} escudo arcano ao fim da rodada.`);
  }

  return { combatant: actor, tracker: resetTacticalPathRound(tracker), messages };
}

export function applyTacticalPathSummonExpiry({
  pathKey,
  tracker,
  combatant,
  expired,
}: {
  pathKey: string | null | undefined;
  tracker: TacticalPathTracker;
  combatant: CombatantState;
  expired: boolean;
}) {
  if (!pathIs(pathKey, "senhor-dos-mortos") || !expired || tracker.summonBonusUsedThisRound) {
    return { combatant, tracker, message: null as string | null };
  }
  const resource = addClassResource(combatant, 1);
  return {
    combatant: resource.combatant,
    tracker: { ...tracker, summonBonusUsedThisRound: true },
    message: resource.gained ? `Senhor dos Mortos: +${resource.gained} ${combatant.classResourceName}.` : null,
  };
}

export function tacticalPathIgnoresLineOfSight(
  pathKey: string | null | undefined,
  target: CombatantState,
) {
  return (
    pathIs(pathKey, "cacador") &&
    Object.entries(target.statuses).some(([key, status]) =>
      /marca|mark|selo/.test(`${key} ${status.name}`.toLowerCase()),
    )
  );
}

export function consumeTacticalPathItemAction(
  pathKey: string | null | undefined,
  tracker: TacticalPathTracker,
) {
  if (pathIs(pathKey, "trapaceiro") && !tracker.freeItemUsed) {
    return {
      consumeAction: false,
      tracker: { ...tracker, freeItemUsed: true },
      message: "Trapaceiro: primeiro item do combate não consumiu a ação de item.",
    };
  }
  return { consumeAction: true, tracker, message: null as string | null };
}
