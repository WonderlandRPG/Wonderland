import type { ClassSkill } from "@/lib/game/classes";
import type { CombatantState, DamageType } from "@/lib/game/combat";

export type TacticalClassResourceTracker = {
  lastCategory: string | null;
  lastTargetId: string | null;
  generatedThisRound: number;
  movedThisTurn: boolean;
};

export const initialTacticalClassResourceTracker: TacticalClassResourceTracker = {
  lastCategory: null,
  lastTargetId: null,
  generatedThisRound: 0,
  movedThisTurn: false,
};

export type TacticalClassResourceContext = {
  action: "basic" | "skill" | "incoming";
  skill?: ClassSkill;
  successfulOperationIndexes?: number[];
  dealtDamage?: number;
  tookDamage?: number;
  damageType?: DamageType;
  distance?: number;
  healed?: number;
  shieldGranted?: number;
  shieldAbsorbed?: number;
  affectedTargets?: number;
  targetId?: string;
  targetMaxHp?: number;
  targetHasActed?: boolean;
  targetMarked?: boolean;
};

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function successfulOperations(skill: ClassSkill | undefined, indexes: number[] | undefined) {
  if (!skill) return [];
  if (!indexes) return skill.operations;
  const success = new Set(indexes);
  return skill.operations.filter((_, index) => success.has(index));
}

function hasOperation(operations: ClassSkill["operations"], names: string[]) {
  return operations.some((operation) => names.includes(operation.operation));
}

function addResource(combatant: CombatantState, amount: number) {
  const gained = Math.max(
    0,
    Math.min(combatant.maxClassResource, combatant.classResource + amount) - combatant.classResource,
  );
  return {
    combatant: gained > 0 ? { ...combatant, classResource: combatant.classResource + gained } : combatant,
    gained,
  };
}

export function markTacticalMovement(tracker: TacticalClassResourceTracker, moved: boolean) {
  return moved ? { ...tracker, movedThisTurn: true } : tracker;
}

export function resetTacticalClassResourceRound(tracker: TacticalClassResourceTracker) {
  return { ...tracker, generatedThisRound: 0, movedThisTurn: false };
}

export function applyTacticalClassResourceGeneration({
  combatant,
  className,
  tracker,
  context,
}: {
  combatant: CombatantState;
  className: string;
  tracker: TacticalClassResourceTracker;
  context: TacticalClassResourceContext;
}) {
  const classKey = normalize(className);
  const dealt = Math.max(0, context.dealtDamage ?? 0);
  const took = Math.max(0, context.tookDamage ?? 0);
  const healed = Math.max(0, context.healed ?? 0);
  const shield = Math.max(0, context.shieldGranted ?? 0);
  const absorbed = Math.max(0, context.shieldAbsorbed ?? 0);
  const operations = successfulOperations(context.skill, context.successfulOperationIndexes);
  const category = context.skill?.category ?? (context.action === "basic" ? "Ataque Básico" : null);
  const targetId = context.targetId ?? null;
  let requested = 0;
  let reason = "";

  if (classKey === "alquimista" && context.action === "skill" && category) {
    if (tracker.lastCategory && normalize(tracker.lastCategory) !== normalize(category)) {
      requested = Math.min(5, Math.max(0, 10 - tracker.generatedThisRound));
      reason = "categoria diferente da ação anterior";
    }
  } else if (classKey === "arqueiro" && dealt > 0 && (context.distance ?? 0) >= 3) {
    requested = 10;
    reason = "dano a 3+ casas";
  } else if (classKey === "assassino" && dealt > 0 && context.targetHasActed === false) {
    requested = 15;
    reason = "alvo ainda não agiu na rodada";
  } else if (classKey === "barbaro") {
    if (dealt > 0) requested += 10;
    if (took > 0) requested += 5;
    if (requested) reason = dealt > 0 && took > 0 ? "dano causado e recebido" : dealt > 0 ? "dano causado" : "dano recebido";
  } else if (classKey === "bardo" && context.action === "skill" && targetId) {
    if (tracker.lastTargetId && tracker.lastTargetId !== targetId && operations.length > 0) {
      requested = 1;
      reason = "alvo diferente da ação anterior";
    }
  } else if (classKey === "bruxo" && hasOperation(operations, ["DEBUFF", "APPLY_STATUS", "STUN", "ROOT", "SILENCE", "FEAR", "TAUNT"])) {
    requested = 1;
    reason = "status negativo aplicado";
  } else if (classKey === "cavaleiro") {
    if (took > 0) requested += 10;
    if (hasOperation(operations, ["TAUNT"])) requested += 15;
    if (requested) reason = hasOperation(operations, ["TAUNT"]) ? "TAUNT/dano recebido" : "dano recebido";
  } else if (classKey === "clerigo" && (healed > 0 || shield > 0)) {
    requested = 10;
    reason = healed > 0 ? "cura efetiva" : "escudo aplicado";
  } else if (classKey === "druida" && context.action === "skill" && (context.affectedTargets ?? 0) >= 2) {
    requested = 10;
    reason = "habilidade afetou 2+ alvos";
  } else if (classKey === "feiticeiro" && dealt > 0 && context.damageType === "magic") {
    requested = 15;
    reason = "dano mágico";
  } else if (classKey === "guerreiro") {
    if (context.action === "basic" && dealt > 0) requested += 10;
    if (absorbed > 0) requested += 10;
    if (requested) reason = absorbed > 0 ? "dano bloqueado por escudo" : "ataque básico acertou";
  } else if (classKey === "ladino" && hasOperation(operations, ["DEBUFF"])) {
    requested = 1;
    reason = "inimigo recebeu debuff";
  } else if (classKey === "mago" && context.action === "skill" && (context.skill?.cost ?? 0) > 0 && operations.length > 0) {
    requested = 1;
    reason = "habilidade com custo usada";
  } else if (classKey === "monge" && context.action === "basic" && dealt > 0 && tracker.generatedThisRound < 1) {
    requested = 1;
    reason = "ataque básico da rodada";
  } else if (classKey === "necromante") {
    const loss = Math.max(dealt, took);
    const referenceMax = took > 0 ? combatant.maxHp : Math.max(0, context.targetMaxHp ?? 0);
    if (loss > 0 && referenceMax > 0 && loss >= referenceMax * 0.2) {
      requested = 5;
      reason = "unidade perdeu 20%+ do HP em uma ação";
    }
  } else if (classKey === "ninja" && context.action === "skill") {
    const remaining = Math.max(0, 2 - tracker.generatedThisRound);
    if (tracker.movedThisTurn && remaining > 0) requested += 1;
    if (dealt > 0 && context.targetMarked && requested < remaining) requested += 1;
    if (requested) reason = tracker.movedThisTurn && context.targetMarked ? "movimento + alvo marcado" : tracker.movedThisTurn ? "moveu antes da habilidade" : "alvo marcado";
  } else if (classKey === "paladino") {
    if (healed > 0 || shield > 0) requested += 10;
    if (took > 0) requested += 5;
    if (requested) reason = healed > 0 || shield > 0 ? "cura/escudo" : "dano recebido";
  }

  const { combatant: nextCombatant, gained } = addResource(combatant, requested);
  const shouldRememberAction = context.action !== "incoming";
  const nextTracker: TacticalClassResourceTracker = {
    ...tracker,
    lastCategory: shouldRememberAction && category ? category : tracker.lastCategory,
    lastTargetId: shouldRememberAction && targetId ? targetId : tracker.lastTargetId,
    generatedThisRound: tracker.generatedThisRound + gained,
    movedThisTurn: tracker.movedThisTurn,
  };

  return {
    combatant: nextCombatant,
    tracker: nextTracker,
    gained,
    message: gained > 0 ? `RECURSO DE CLASSE: +${gained} ${combatant.classResourceName} (${reason}).` : null,
  };
}

export function applyNecromancerSummonExpiry(
  combatant: CombatantState,
  className: string,
  beforeStatuses: CombatantState["statuses"],
  afterStatuses: CombatantState["statuses"],
) {
  if (normalize(className) !== "necromante") return { combatant, gained: 0, message: null as string | null };
  const expiredSummon = Object.entries(beforeStatuses).some(
    ([key, status]) =>
      !afterStatuses[key] &&
      /servo|esqueleto|avatar|invoc/i.test(`${key} ${status.name}`.toLowerCase()),
  );
  if (!expiredSummon) return { combatant, gained: 0, message: null as string | null };
  const result = addResource(combatant, 5);
  return {
    combatant: result.combatant,
    gained: result.gained,
    message: result.gained ? `RECURSO DE CLASSE: +${result.gained} ${combatant.classResourceName} (invocação expirou).` : null,
  };
}
