import type { ClassSkill } from "@/lib/game/classes";
import type { CombatAttributes, CombatantState } from "@/lib/game/combat";
import type { ItemSpecialEffect } from "@/lib/game/item-effects";
import type { EquippedTitleData } from "@/components/characters/equipped-title";
import type { SharedBattleState } from "@/lib/game/turn-engine";
import type { CharacterCosmeticLoadout } from "@/lib/content/character-cosmetics";

export interface ArenaCharacter {
  id: string;
  name: string;
  level: number;
  adventureRank: string;
  imageUrl: string;
  equippedTitle: EquippedTitleData | null;
  cosmetics: CharacterCosmeticLoadout;
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
  basicAttackDamageType?: "physical" | "magic";
  attributes: CombatAttributes;
  skills: ClassSkill[];
  raceAbilities: ClassSkill[];
  items: Array<{ id: string; name: string; description: string }>;
  combatLore: Array<{ name: string; description: string }>;
  equipmentEffects: ItemSpecialEffect[];
}

export interface PvpBattleState extends Omit<SharedBattleState, "fighters" | "turnEndsAt"> {
  fighters: Record<string, CombatantState>;
  turnEndsAt: string;
}

export interface PvpRoomSnapshot {
  matchId: string;
  version: number;
  ownCharacterId: string;
  opponentCharacterId: string;
  state: PvpBattleState;
}
