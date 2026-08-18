import type { ArenaCharacter } from "@/lib/game/arena-types";
import type { CombatantState } from "@/lib/game/combat";

export type ResourceTrigger =
  | "BASIC_ATTACK_HIT"
  | "DAMAGE_DEALT"
  | "DAMAGE_TAKEN"
  | "HEAL_APPLIED"
  | "SHIELD_APPLIED"
  | "STATUS_APPLIED"
  | "TARGET_CHANGED"
  | "MULTI_TARGET_HIT";

function gainFor(
  events: Array<{ trigger: string; amount: number }> | undefined,
  trigger: ResourceTrigger,
) {
  return (events ?? [])
    .filter((entry) => entry.trigger === trigger)
    .reduce((sum, entry) => sum + Math.max(0, entry.amount), 0);
}

export function applyResourceTrigger(
  combatant: CombatantState,
  character: Pick<ArenaCharacter, "classResource" | "raceResource">,
  trigger: ResourceTrigger,
) {
  const classGain = gainFor(character.classResource.generationEvents, trigger);
  const raceGain = gainFor(character.raceResource?.generationEvents, trigger);
  if (classGain === 0 && raceGain === 0) return combatant;
  return {
    ...combatant,
    classResource: Math.min(combatant.maxClassResource, combatant.classResource + classGain),
    raceResource: Math.min(combatant.maxRaceResource, combatant.raceResource + raceGain),
  };
}

export function applyEventResourceGeneration(input: {
  actor: CombatantState;
  target: CombatantState;
  actorCharacter: Pick<ArenaCharacter, "classResource" | "raceResource">;
  targetCharacter?: Pick<ArenaCharacter, "classResource" | "raceResource">;
  event: { kind: "damage" | "heal" | "shield" | "utility" | "error"; amount: number };
  area?: boolean;
  basic?: boolean;
}) {
  let actor = input.actor;
  let target = input.target;
  if (input.basic && input.event.kind === "damage" && input.event.amount > 0) {
    actor = applyResourceTrigger(actor, input.actorCharacter, "BASIC_ATTACK_HIT");
  }
  if (input.event.kind === "damage" && input.event.amount > 0) {
    actor = applyResourceTrigger(actor, input.actorCharacter, "DAMAGE_DEALT");
    if (input.targetCharacter)
      target = applyResourceTrigger(target, input.targetCharacter, "DAMAGE_TAKEN");
  }
  if (input.event.kind === "heal" && input.event.amount > 0)
    actor = applyResourceTrigger(actor, input.actorCharacter, "HEAL_APPLIED");
  if (input.event.kind === "shield" && input.event.amount > 0)
    actor = applyResourceTrigger(actor, input.actorCharacter, "SHIELD_APPLIED");
  if (input.event.kind === "utility")
    actor = applyResourceTrigger(actor, input.actorCharacter, "STATUS_APPLIED");
  if (input.area)
    actor = applyResourceTrigger(actor, input.actorCharacter, "MULTI_TARGET_HIT");
  return { actor, target };
}
