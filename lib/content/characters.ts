import "server-only";

import { notFound } from "next/navigation";

import { getCharacterRules } from "@/lib/content/character-settings";
import { defaultCombatRules } from "@/lib/game/combat";
import type { Database } from "@/lib/db/types";
import { parseClassPayload, getUnlockedClassSkills, type ClassPayload } from "@/lib/game/classes";
import {
  allocatedAttributesSchema,
  buildCharacterStats,
  getUnlockedRaceAbilities,
  type AllocatedAttributes,
} from "@/lib/game/characters";
import { parseRacePayload, type RacePayload } from "@/lib/game/races";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type CharacterRow = Database["public"]["Tables"]["v2_characters"]["Row"];
type ContentRow = Database["public"]["Tables"]["v2_content"]["Row"];

export interface CharacterRecord extends Omit<CharacterRow, "allocated_attributes"> {
  allocatedAttributes: AllocatedAttributes;
}

export interface CharacterSheet extends CharacterRecord {
  race: { id: string; name: string; payload: RacePayload };
  characterClass: { id: string; name: string; payload: ClassPayload };
  stats: ReturnType<typeof buildCharacterStats>;
  unlockedRaceAbilities: RacePayload["progression"];
  unlockedClassSkills: ClassPayload["progression"];
}

function parseCharacter(row: CharacterRow): CharacterRecord | null {
  const allocated = allocatedAttributesSchema.safeParse(row.allocated_attributes);
  if (!allocated.success) return null;
  const { allocated_attributes: _raw, ...record } = row;
  void _raw;
  return { ...record, allocatedAttributes: allocated.data };
}

async function loadSheets(rows: CharacterRow[]): Promise<CharacterSheet[]> {
  const client = await createServerSupabaseClient();
  if (!client || rows.length === 0) return [];
  const records = rows
    .map(parseCharacter)
    .filter((entry): entry is CharacterRecord => Boolean(entry));
  const ids = [...new Set(records.flatMap((entry) => [entry.race_id, entry.class_id]))];
  const { data } = await client.from("v2_content").select("*").in("id", ids);
  const content = new Map((data ?? []).map((entry) => [entry.id, entry as ContentRow]));
  const characterRules = await getCharacterRules();
  return records.flatMap((record) => {
    const raceRow = content.get(record.race_id);
    const classRow = content.get(record.class_id);
    if (!raceRow || !classRow) return [];
    const race = parseRacePayload(raceRow.payload);
    const characterClass = parseClassPayload(classRow.payload);
    if (!race.success || !characterClass.success) return [];
    return [
      {
        ...record,
        race: { id: raceRow.id, name: raceRow.name, payload: race.data },
        characterClass: { id: classRow.id, name: classRow.name, payload: characterClass.data },
        stats: buildCharacterStats(
          record.allocatedAttributes,
          race.data,
          characterRules,
          defaultCombatRules,
        ),
        unlockedRaceAbilities: getUnlockedRaceAbilities(race.data, record.level),
        unlockedClassSkills: getUnlockedClassSkills(characterClass.data, record.level),
      },
    ];
  });
}

export async function getCharacterSheets(userId: string) {
  const client = await createServerSupabaseClient();
  if (!client) return [];
  const { data, error } = await client
    .from("v2_characters")
    .select("*")
    .eq("user_id", userId)
    .order("created_at");
  if (error) {
    if (error.code === "42P01") return [];
    throw new Error("Não foi possível carregar os personagens.");
  }
  return loadSheets(data ?? []);
}

export async function getAllCharacterOptions() {
  const client = await createServerSupabaseClient();
  if (!client) return [];
  const { data, error } = await client
    .from("v2_characters")
    .select("id, name, level, user_id")
    .order("name");
  if (error) {
    if (error.code === "42P01") return [];
    throw new Error("Não foi possível carregar os personagens.");
  }
  const userIds = [...new Set((data ?? []).map((entry) => entry.user_id))];
  const names = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: profiles } = await client
      .from("v2_profiles")
      .select("user_id, display_name")
      .in("user_id", userIds);
    profiles?.forEach((profile) => names.set(profile.user_id, profile.display_name || "Jogador"));
  }
  return (data ?? []).map((entry) => ({
    id: entry.id,
    name: entry.name,
    level: entry.level,
    ownerName: names.get(entry.user_id) ?? "Jogador",
  }));
}

export async function getCharacterSheet(id: string) {
  const client = await createServerSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.from("v2_characters").select("*").eq("id", id).maybeSingle();
  if (error) {
    if (error.code === "42P01") return null;
    throw new Error("Não foi possível carregar este personagem.");
  }
  if (!data) return null;
  return (await loadSheets([data]))[0] ?? null;
}

export async function requireCharacterSheet(id: string) {
  const sheet = await getCharacterSheet(id);
  if (!sheet) notFound();
  return sheet;
}
