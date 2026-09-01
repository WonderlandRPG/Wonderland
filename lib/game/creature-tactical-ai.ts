import type { ClassSkill } from "@/lib/game/classes";
import type { TacticalAiProfile } from "@/lib/game/tactical-ai-profiles";

function hasOperation(skill: ClassSkill, operation: string) {
  return skill.operations.some((entry) => entry.operation === operation);
}

function damageBase(skill: ClassSkill) {
  return skill.operations
    .filter((entry) => entry.operation === "DAMAGE")
    .reduce((sum, entry) => sum + entry.base, 0);
}

export function chooseCreatureTacticalSkill(input: {
  skills: ClassSkill[];
  cooldowns: Record<string, number>;
  distance: number;
  profile: TacticalAiProfile;
  requireInRange?: boolean;
}) {
  const available = input.skills.filter((skill) => (input.cooldowns[skill.key] ?? 0) <= 0);
  const candidates = input.requireInRange === false
    ? available
    : available.filter((skill) => input.distance <= skill.range);

  if (!candidates.length) return null;

  const scored = candidates.map((skill, index) => {
    let score = damageBase(skill);

    if (input.profile === "controller") {
      if (hasOperation(skill, "STUN")) score += 700;
      if (hasOperation(skill, "ROOT")) score += 600;
      if (hasOperation(skill, "SILENCE")) score += 500;
      if (hasOperation(skill, "FEAR")) score += 450;
      if (hasOperation(skill, "PUSH")) score += 250;
    }

    if (input.profile === "aggressive") {
      if (hasOperation(skill, "PUSH")) score += 400;
      score += Math.max(0, 5 - skill.range) * 25;
    }

    if (input.profile === "ranged") {
      score += skill.range * 80;
      if (skill.range >= 3) score += 250;
    }

    if (input.distance === skill.range) score += 30;
    score -= skill.cooldown * 2;

    return { skill, score, index };
  });

  scored.sort((left, right) =>
    right.score - left.score ||
    left.index - right.index ||
    left.skill.key.localeCompare(right.skill.key),
  );

  return scored[0]?.skill ?? null;
}

export function getCreaturePlanningSkillRange(input: {
  skills: ClassSkill[];
  cooldowns: Record<string, number>;
  profile: TacticalAiProfile;
  fallbackRange: number;
}) {
  const skill = chooseCreatureTacticalSkill({
    ...input,
    distance: Number.POSITIVE_INFINITY,
    requireInRange: false,
  });
  return skill?.range ?? input.fallbackRange;
}
