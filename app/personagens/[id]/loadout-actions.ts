"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireCurrentAccount } from "@/lib/auth/account";
import { getCharacterSheet } from "@/lib/content/characters";
import {
  applySkillBalanceOverride,
  buildSkillLoadoutAvailability,
  isTalentTreeSelectionValid,
} from "@/lib/game/skill-loadout";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function submittedKeys(formData: FormData, name: string) {
  return [...new Set(formData.getAll(name).map(String).filter(Boolean))];
}

export async function saveCharacterSkillLoadoutAction(characterId: string, formData: FormData) {
  const parsedId = z.uuid().safeParse(characterId);
  if (!parsedId.success) redirect("/personagens?notice=erro");
  const account = await requireCurrentAccount(`/personagens/${characterId}?tab=habilidades`);
  const character = await getCharacterSheet(parsedId.data);
  if (!character || character.user_id !== account.id) redirect("/personagens?notice=erro");

  const classSkillKeys = submittedKeys(formData, "classSkillKey");
  const raceSkillKeys = submittedKeys(formData, "raceSkillKey");
  const passiveKeys = submittedKeys(formData, "passiveKey");
  const talentKeys = submittedKeys(formData, "talentKey");
  const availability = buildSkillLoadoutAvailability({
    classSkills: character.unlockedClassSkills.filter((skill) =>
      Boolean(applySkillBalanceOverride(skill, character.skillBalanceOverrides)),
    ),
    raceSkills: character.unlockedRaceAbilities.filter((skill) =>
      Boolean(applySkillBalanceOverride(skill, character.skillBalanceOverrides)),
    ),
    passiveOptions: character.passiveOptions,
    talentSkills: character.talentSkills,
  });
  const submitted = { classSkillKeys, raceSkillKeys, passiveKeys, talentKeys };
  const groups = [
    ["classSkillKeys", availability.classSkillKeys, character.skillLoadoutLimits.classSkills],
    ["raceSkillKeys", availability.raceSkillKeys, character.skillLoadoutLimits.raceSkills],
    ["passiveKeys", availability.passiveKeys, character.skillLoadoutLimits.passives],
    ["talentKeys", availability.talentKeys, character.skillLoadoutLimits.talents],
  ] as const;
  const invalid = groups.some(([key, allowed, limit]) => {
    const values = submitted[key];
    return values.length > limit || values.some((value) => !allowed.includes(value));
  });
  const selectedTalents = new Set(talentKeys);
  const pathSkillKeys = new Set(availability.talentKeys);
  const equipsInactiveTalent = classSkillKeys.some(
    (key) => pathSkillKeys.has(key) && !selectedTalents.has(key),
  );
  if (
    invalid ||
    equipsInactiveTalent ||
    !isTalentTreeSelectionValid(talentKeys, availability.talentKeys)
  ) {
    redirect(`/personagens/${character.id}?tab=habilidades&status=loadout-invalido`);
  }

  const client = await createServerSupabaseClient();
  if (!client) redirect(`/personagens/${character.id}?tab=habilidades&status=loadout-erro`);
  const { error } = await client.from("v2_character_skill_loadouts").upsert({
    character_id: character.id,
    equipped_class_skill_keys: classSkillKeys,
    equipped_race_skill_keys: raceSkillKeys,
    selected_passive_keys: passiveKeys,
    selected_talent_keys: talentKeys,
  });
  if (error) redirect(`/personagens/${character.id}?tab=habilidades&status=loadout-erro`);
  revalidatePath(`/personagens/${character.id}`);
  revalidatePath("/arena");
  redirect(`/personagens/${character.id}?tab=habilidades&status=loadout-salvo`);
}
