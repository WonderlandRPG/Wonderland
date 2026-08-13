import type { ClassSkill } from "@/lib/game/classes";
import type { ArenaPosition } from "@/lib/game/arena-types";

function distance(a: ArenaPosition, b: ArenaPosition) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}
function toward(from: ArenaPosition, target: ArenaPosition, maximum: number) {
  const next = { ...from };
  for (let step = 0; step < maximum && distance(next, target) > 1; step += 1) {
    if (next.x !== target.x) next.x += Math.sign(target.x - next.x);
    else if (next.y !== target.y) next.y += Math.sign(target.y - next.y);
  }
  return next;
}
function away(
  from: ArenaPosition,
  source: ArenaPosition,
  maximum: number,
  width = 20,
  height = 14,
) {
  const next = { ...from };
  for (let step = 0; step < maximum; step += 1) {
    const dx = next.x - source.x,
      dy = next.y - source.y;
    if (Math.abs(dx) >= Math.abs(dy))
      next.x = Math.max(0, Math.min(width - 1, next.x + (dx >= 0 ? 1 : -1)));
    else next.y = Math.max(0, Math.min(height - 1, next.y + (dy >= 0 ? 1 : -1)));
  }
  return next;
}
export function resolveSkillMovement(
  skill: ClassSkill,
  actor: ArenaPosition,
  target: ArenaPosition,
) {
  let nextActor = { ...actor },
    nextTarget = { ...target };
  for (const operation of skill.operations) {
    const amount = operation.distance || 0;
    if (amount <= 0) continue;
    if (operation.operation === "MOVE" || operation.operation === "TELEPORT")
      nextActor = toward(nextActor, nextTarget, amount);
    if (operation.operation === "PUSH") nextTarget = away(nextTarget, nextActor, amount);
  }
  return { actor: nextActor, target: nextTarget };
}
