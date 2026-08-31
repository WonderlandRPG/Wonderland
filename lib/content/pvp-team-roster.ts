import "server-only";

import { getCharacterRules } from "@/lib/content/character-settings";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { defaultCombatRules } from "@/lib/game/combat";
import {
  getUnlockedClassSkills,
  getUnlockedPathSkills,
  parseClassPayload,
  prepareArenaSkill,
} from "@/lib/game/classes";
import {
  allocatedAttributesSchema,
  buildCharacterStats,
  getUnlockedRaceAbilities,
} from "@/lib/game/characters";
import { parseRacePayload } from "@/lib/game/races";
import { attributeKeys, attributesSchema } from "@/lib/game/schemas";
import { parseItemSpecialEffects } from "@/lib/game/item-effects";
import { parseTitleStyle } from "@/lib/game/title-style";
import { getClassBasicAttackRange } from "@/lib/game/class-range";
import {
  getClassBasicAttackDamageType,
  prepareClassCombatSkills,
  prepareRaceCombatSkills,
} from "@/lib/game/class-combat-profile";
import type { ArenaCharacter } from "@/lib/game/arena-types";
import { parseCharacterCosmetics } from "@/lib/content/character-cosmetics";

type RawMember = {
  team: number;
  slot: number;
  character: {
    id: string;
    name: string;
    race_id: string;
    class_id: string;
    class_path_key: string | null;
    level: number;
    image_url: string | null;
    adventure_rank: string;
    allocated_attributes: unknown;
    cosmetics?: unknown;
  };
  equipment: Array<{
    id: string;
    character_id: string;
    item_id: string;
    quantity: number;
    equipped_slot: string | null;
  }>;
};

type RawRoster = { format: string; ownTeam: number; members: RawMember[] };
type RpcReply = { data: unknown; error: { message: string } | null };
type UntypedRpc = (fn: string, args: Record<string, unknown>) => Promise<RpcReply>;

function isRawRoster(value: unknown): value is RawRoster {
  if (!value || Array.isArray(value) || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return typeof row.format === "string" && typeof row.ownTeam === "number" && Array.isArray(row.members);
}

export async function getPvpTeamRoster(matchId: string) {
  const client = await createServerSupabaseClient();
  if (!client) return null;
  const rpc = client.rpc.bind(client) as unknown as UntypedRpc;
  const { data, error } = await rpc("v2_get_pvp_team_roster", { p_match_id: matchId });
  if (error || !isRawRoster(data)) return null;

  const rawMembers = data.members.filter(
    (member): member is RawMember => Boolean(member && member.character && Array.isArray(member.equipment)),
  );
  if (rawMembers.length < 2) return null;

  const contentIds = [
    ...new Set(rawMembers.flatMap((member) => [member.character.race_id, member.character.class_id])),
  ];
  const { data: contentRows } = await client.from("v2_content").select("id,name,payload").in("id", contentIds);
  const content = new Map((contentRows ?? []).map((entry) => [entry.id, entry]));

  const itemIds = [...new Set(rawMembers.flatMap((member) => member.equipment.map((item) => item.item_id)))];
  const { data: shopRows } = itemIds.length
    ? await client
        .from("v2_shop_items")
        .select("id,name,description,category,price,rarity,slot,attributes,special_effects,title_style,two_handed")
        .in("id", itemIds)
    : { data: [] };
  const shop = new Map((shopRows ?? []).map((entry) => [entry.id, entry]));
  const characterRules = await getCharacterRules();

  const members = rawMembers.flatMap((member) => {
    const raw = member.character;
    const allocated = allocatedAttributesSchema.safeParse(raw.allocated_attributes);
    const raceRow = content.get(raw.race_id);
    const classRow = content.get(raw.class_id);
    if (!allocated.success || !raceRow || !classRow) return [];
    const race = parseRacePayload(raceRow.payload);
    const characterClass = parseClassPayload(classRow.payload);
    if (!race.success || !characterClass.success) return [];

    const inventory = member.equipment.flatMap((entry) => {
      const item = shop.get(entry.item_id);
      if (!item) return [];
      const parsedAttributes = attributesSchema.partial().safeParse(item.attributes);
      return [{
        id: entry.id,
        name: item.name,
        description: item.description,
        category: item.category,
        rarity: item.rarity,
        equippedSlot: entry.equipped_slot,
        attributes: parsedAttributes.success ? parsedAttributes.data : {},
        specialEffects: parseItemSpecialEffects(item.special_effects),
        titleStyle:
          item.title_style && typeof item.title_style === "object" && !Array.isArray(item.title_style)
            ? parseTitleStyle(item.title_style)
            : null,
      }];
    });

    const equipmentBonuses = Object.fromEntries(
      attributeKeys.map((attribute) => [
        attribute,
        inventory.reduce((total, entry) => total + (entry.attributes[attribute] ?? 0), 0),
      ]),
    );
    const stats = buildCharacterStats(allocated.data, race.data, characterRules, defaultCombatRules, equipmentBonuses);
    const unlockedClassSkills = [
      ...getUnlockedClassSkills(characterClass.data, raw.level),
      ...getUnlockedPathSkills(characterClass.data, raw.class_path_key, raw.level),
    ].sort((left, right) => left.level - right.level || left.name.localeCompare(right.name));
    const unlockedRaceAbilities = getUnlockedRaceAbilities(race.data, raw.level);
    const rawClassSkills = unlockedClassSkills.filter((skill) => !/passiva/i.test(skill.type));
    const skills = prepareClassCombatSkills(classRow.name, characterClass.data, rawClassSkills).map(prepareArenaSkill);
    const raceAbilities = prepareRaceCombatSkills(unlockedRaceAbilities).map(prepareArenaSkill);
    const equippedTitle = inventory.find((item) => item.equippedSlot === "title") ?? null;

    const character: ArenaCharacter = {
      id: raw.id,
      name: raw.name,
      level: raw.level,
      adventureRank: raw.adventure_rank,
      imageUrl: raw.image_url ?? "",
      cosmetics: parseCharacterCosmetics(raw.cosmetics),
      equippedTitle: equippedTitle
        ? { name: equippedTitle.name, rarity: equippedTitle.rarity, titleStyle: equippedTitle.titleStyle }
        : null,
      raceName: raceRow.name,
      className: classRow.name,
      baseHp: race.data.baseHp,
      baseMana: race.data.baseMana,
      classResource: characterClass.data.resource,
      raceResource: race.data.resource,
      usesMana: [...skills, ...raceAbilities].some((skill) => skill.resource === "mana"),
      basicAttackRange: getClassBasicAttackRange(classRow.name),
      basicAttackDamageType: getClassBasicAttackDamageType(classRow.name, characterClass.data),
      attributes: stats.attributes,
      skills,
      raceAbilities,
      combatLore: [
        { name: characterClass.data.passive.name, description: characterClass.data.passive.description },
        { name: characterClass.data.mechanic.name, description: characterClass.data.mechanic.description },
        ...race.data.traits,
        ...race.data.mechanics,
      ],
      equipmentEffects: inventory.filter((item) => item.equippedSlot).flatMap((item) => item.specialEffects),
      items: inventory
        .filter((item) => /consum|poção|pocao/i.test(item.category))
        .map((item) => ({ id: item.id, name: item.name, description: item.description })),
    };
    return [{ team: member.team, slot: member.slot, character }];
  });

  if (!members.length) return null;
  return { format: data.format as "solo" | "duo", ownTeam: data.ownTeam, members };
}
