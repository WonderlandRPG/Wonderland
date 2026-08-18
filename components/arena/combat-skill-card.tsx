"use client";

import type { ArenaCharacter } from "@/lib/game/arena-types";
import type { CombatRules, CombatantState } from "@/lib/game/combat";
import { getSkillCombatPreview } from "@/lib/game/skill-preview";

export function CombatSkillCard({
  fighter,
  target,
  rules,
  skill,
  disabled,
  used,
  onClick,
}: {
  fighter: CombatantState;
  target: CombatantState;
  rules: CombatRules;
  skill: ArenaCharacter["skills"][number];
  disabled: boolean;
  used?: boolean;
  onClick(): void;
}) {
  const cooldown = fighter.cooldowns[skill.key] ?? 0;
  const available =
    skill.resource === "mana"
      ? fighter.mana
      : skill.resource === "life"
        ? fighter.hp
        : skill.resource === "special"
          ? skill.resourceKey === "race"
            ? fighter.raceResource
            : fighter.classResource
          : Number.POSITIVE_INFINITY;
  const unavailable = cooldown > 0 || available < skill.cost || disabled || used;
  const resourceName =
    skill.resource === "mana"
      ? "Mana"
      : skill.resource === "life"
        ? "HP"
        : skill.resource === "special"
          ? skill.resourceKey === "race"
            ? fighter.raceResourceName
            : fighter.classResourceName
          : "";
  const preview = getSkillCombatPreview(skill, fighter, target, rules);

  return (
    <button
      className={`combat-skill-card ${used ? "is-used" : ""}`}
      disabled={unavailable}
      onClick={onClick}
      type="button"
    >
      <span className="combat-skill-card__head">
        <strong>{skill.name}</strong>
        <small>{used ? "Usada neste turno" : cooldown ? `Recarga: ${cooldown}T` : skill.cost ? `${skill.cost} ${resourceName}` : "Sem custo"}</small>
      </span>
      <span className="combat-skill-card__description">{preview.description}</span>
      <span className="combat-skill-card__effects">
        {preview.effectLines.map((line) => <em key={line}>{line}</em>)}
      </span>
      <span className="combat-skill-card__meta">
        <b>{skill.target === "self" ? "Próprio" : skill.target === "ally" ? "Aliado" : skill.target === "area" ? "Área" : "Inimigo"}</b>
        {skill.cooldown ? <b>CD {skill.cooldown}T</b> : null}
        {skill.chance < 100 ? <b>{skill.chance}% chance</b> : null}
      </span>
    </button>
  );
}
