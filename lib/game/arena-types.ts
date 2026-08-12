import type { ClassSkill } from "@/lib/game/classes";
import type { CombatAttributes, CombatantState } from "@/lib/game/combat";
import type { ItemSpecialEffect } from "@/lib/game/item-effects";
import type { EquippedTitleData } from "@/components/characters/equipped-title";

export interface ArenaCharacter {
  id: string;
  name: string;
  level: number;
  adventureRank: string;
  imageUrl: string;
  equippedTitle: EquippedTitleData | null;
  raceName: string;
  className: string;
  baseHp: number;
  baseMana: number;
  classResource: {
    name: string;
    initial: number;
    maximum: number;
    generationEvents?: Array<{ trigger: string; amount: number }>;
  };
  raceResource: {
    name: string;
    initial: number;
    maximum: number;
    generationEvents?: Array<{ trigger: string; amount: number }>;
  } | null;
  usesMana: boolean;
  basicAttackRange: number;
  attributes: CombatAttributes;
  skills: ClassSkill[];
  raceAbilities: ClassSkill[];
  items: Array<{ id: string; name: string; description: string }>;
  combatLore: Array<{ name: string; description: string }>;
  equipmentEffects: ItemSpecialEffect[];
}

export type ArenaPosition = { x: number; y: number };
export type PvpTurnActions = {
  move: boolean;
  basic: boolean;
  race: boolean;
  class: boolean;
  item: boolean;
  defend: boolean;
};

export interface PvpBattleState {
  turn: number;
  activeCharacterId: string;
  fighters: Record<string, CombatantState>;
  positions: Record<string, ArenaPosition>;
  actions: PvpTurnActions;
  status: "active" | "finished" | "abandoned";
  winnerCharacterId: string | null;
  message: string;
  log: string[];
  turnEndsAt: string;
}

export interface PvpRoomSnapshot {
  matchId: string;
  version: number;
  ownCharacterId: string;
  opponentCharacterId: string;
  state: PvpBattleState;
}
