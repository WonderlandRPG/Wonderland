import type { ClassSkill } from "@/lib/game/classes";
import { simpleDraftDefaults, type SimpleSkillDraft } from "@/lib/admin/simple-skill-builder";

export function simpleDraftFromClassSkill(skill: ClassSkill): SimpleSkillDraft {
  const operation = skill.operations[0];
  const effectType: SimpleSkillDraft["effectType"] =
    operation?.operation === "DAMAGE" ? "damage" :
    operation?.operation === "HEAL" ? "heal" :
    operation?.operation === "SHIELD" ? "shield" :
    operation?.operation === "BUFF" ? "buff" :
    operation?.operation === "DEBUFF" ? "debuff" :
    operation?.operation === "STUN" ? "stun" :
    skill.kind === "damage" ? "damage" : skill.kind === "heal" ? "heal" : skill.kind === "shield" ? "shield" : "buff";
  const scaling = skill.scaling[0] ?? operation?.scaling?.[0];
  const modifier = operation?.modifiers?.[0];
  const targetSide: SimpleSkillDraft["targetSide"] = operation?.target === "ally" ? "ally" : operation?.target === "self" || operation?.target === "source" ? "self" : "enemy";
  const defaults = simpleDraftDefaults();
  return {
    ...defaults,
    name: skill.name,
    description: skill.playerDescription || skill.effect || defaults.description,
    level: skill.level,
    effectType,
    targetSide,
    targetCount: skill.area > 0 ? Math.max(2, Math.min(4, skill.area)) : 1,
    attribute: scaling?.attribute ?? defaults.attribute,
    multiplier: scaling?.multiplier ?? 0,
    baseValue: operation?.base ?? 0,
    damageType: skill.damageType,
    resource: skill.resource,
    resourceKey: skill.resourceKey,
    cost: skill.cost,
    cooldown: skill.cooldown,
    duration: operation?.duration ?? skill.duration,
    chance: operation?.chance ?? skill.chance,
    modifierAttribute: modifier?.attribute ?? defaults.modifierAttribute,
    modifierValue: Math.abs(modifier?.value ?? 0),
    statusName: operation?.status ?? "",
  };
}
