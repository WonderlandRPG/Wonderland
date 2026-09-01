import type { CombatantState, DamageType } from "@/lib/game/combat";
import { applyTacticalRacialReaction } from "@/lib/game/tactical-race-reactions";

export function applyTacticalBasicAttackReactions({
  actorBefore,
  targetBefore,
  actorAfter,
  targetAfter,
  damageType,
  distance,
  firstSuccessfulActionThisRound,
}: {
  actorBefore: CombatantState;
  targetBefore: CombatantState;
  actorAfter: CombatantState;
  targetAfter: CombatantState;
  damageType: DamageType;
  distance: number;
  firstSuccessfulActionThisRound?: boolean;
}) {
  const dealtDamage = Math.max(
    0,
    targetBefore.hp + targetBefore.shield - (targetAfter.hp + targetAfter.shield),
  );

  const actorReaction = applyTacticalRacialReaction(
    actorAfter,
    actorAfter.raceResourceName,
    {
      dealtDamage,
      damageType,
      distance,
      targetHpBefore: targetBefore.hp,
      targetMaxHp: targetBefore.maxHp,
      firstSuccessfulActionThisRound,
    },
  );
  const targetReaction = applyTacticalRacialReaction(
    targetAfter,
    targetAfter.raceResourceName,
    { tookDamage: dealtDamage },
  );

  return {
    actor: actorReaction.combatant,
    target: targetReaction.combatant,
    dealtDamage,
    messages: [actorReaction.message, targetReaction.message ? `${targetAfter.name}: ${targetReaction.message}` : null]
      .filter((entry): entry is string => Boolean(entry)),
  };
}
