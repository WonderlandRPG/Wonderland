import type { ArenaCharacter } from "@/lib/game/arena-types";
import type { CombatantState } from "@/lib/game/combat";

const terms = {
  FOR: /força|fisic|golpe|ataque|dano|feroc|arma/i,
  DEF: /defesa|armadura|prote|resist|guard|tenaz|robust/i,
  RES: /resist|vital|vida|regenera|imortal|sangue/i,
  INI: /iniciativa|veloc|agil|mobil|rápid|rapíd|reflex/i,
  INT: /intelig|magia|mágic|arcana|feitiç|element/i,
  ARC: /arcano|cura|escudo|suporte|espírit|espirit|bênção|bencao/i,
} as const;

export function applyCombatLorePassives(combatant: CombatantState, character: ArenaCharacter) {
  const text = character.combatLore.map((entry) => `${entry.name} ${entry.description}`).join(" ");
  const modifiers = Object.fromEntries(
    Object.entries(terms).map(([attribute, pattern]) => [
      attribute,
      pattern.test(text)
        ? Math.max(6, Math.round(combatant.attributes[attribute as keyof typeof combatant.attributes] * 0.1))
        : 0,
    ]),
  ) as Partial<CombatantState["attributes"]>;
  const activeModifiers = Object.fromEntries(Object.entries(modifiers).filter(([, value]) => value > 0));
  if (!Object.keys(activeModifiers).length) return combatant;
  return {
    ...combatant,
    statuses: {
      ...combatant.statuses,
      "passivas-do-personagem": {
        name: "Passivas do personagem",
        duration: 999,
        stacks: 1,
        modifiers: activeModifiers,
        beneficial: true,
      },
    },
  };
}
