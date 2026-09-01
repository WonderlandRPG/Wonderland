import type { ClassSkill } from "@/lib/game/classes";

function hasSelfSpatialMovement(skill: ClassSkill) {
  return skill.operations.some(
    (operation) =>
      (operation.operation === "MOVE" || operation.operation === "TELEPORT") &&
      (operation.target === "self" || operation.target === "source"),
  );
}

function spatialMovementDistance(skill: ClassSkill) {
  return skill.operations.reduce((maximum, operation) => {
    if (
      (operation.operation === "MOVE" || operation.operation === "TELEPORT") &&
      (operation.target === "self" || operation.target === "source")
    ) {
      return Math.max(maximum, operation.distance || 0);
    }
    return maximum;
  }, 0);
}

/**
 * O catálogo JRPG legado usa range 0 em várias técnicas porque o modo antigo
 * não possuía tabuleiro. No mapa tático, range 0 significaria "mesma casa" e
 * tornaria a habilidade impossível de usar. Esta função preserva ranges reais
 * já cadastrados e só repara valores legados ausentes.
 */
export function getTacticalSkillRange(skill: ClassSkill, classBasicAttackRange: number) {
  const configured = Math.max(0, skill.range || 0);
  const movement = spatialMovementDistance(skill);

  if (hasSelfSpatialMovement(skill)) {
    return Math.max(configured, movement, 1);
  }

  if (configured > 0) return configured;

  const affectsAnotherCell = skill.operations.some(
    (operation) =>
      operation.target === "enemy" || operation.target === "area" || operation.target === "ally",
  );

  if (affectsAnotherCell) return Math.max(1, classBasicAttackRange);
  return 0;
}
