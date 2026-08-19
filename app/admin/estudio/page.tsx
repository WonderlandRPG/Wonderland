import { AdminCreationStudio } from "@/components/admin/admin-creation-studio";
import { AdminContentStudio } from "@/components/admin/admin-content-studio";
import { AdminOperationsStudio } from "@/components/admin/admin-operations-studio";
import { SimpleSkillLibrary } from "@/components/admin/simple-skill-library";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { parseClassPayload } from "@/lib/game/classes";
import { parseRacePayload } from "@/lib/game/races";
import { parseItemSpecialEffects } from "@/lib/game/item-effects";
import { attributesSchema } from "@/lib/game/schemas";
import { simpleDraftFromClassSkill } from "@/lib/admin/simple-skill-reader";
import type { SimpleClassDraft, SimpleItemDraft, SimpleRaceDraft, SimpleTitleDraft } from "@/lib/admin/simple-content-builder";
import type { SimpleMissionDraft } from "@/lib/admin/simple-operations-builder";

export const dynamic = "force-dynamic";
export const metadata = { title: "Studio de Criação" };

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
function stringifySetting(value: unknown) {
  return typeof value === "string" ? JSON.stringify(value) : JSON.stringify(value, null, 2);
}

export default async function AdminCreationStudioPage() {
  const client = await createServerSupabaseClient();
  const [classResult, raceResult, itemResult, missionResult, settingResult] = client ? await Promise.all([
    client.from("v2_content").select("id,name,status,payload").eq("content_type", "class").neq("status", "archived").order("name"),
    client.from("v2_content").select("id,name,status,payload").eq("content_type", "race").neq("status", "archived").order("name"),
    client.from("v2_shop_items").select("*").order("name"),
    client.from("v2_missions").select("id,name,description,objective,kingdom,rank,min_level,is_rank_trial,promotion_rank,active").order("name"),
    client.from("v2_game_settings").select("key,category,label,description,value,status,revision").order("category").order("label"),
  ]) : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }, { data: [] }];

  const classes = (classResult.data ?? []).map((item) => {
    const parsed = parseClassPayload(item.payload);
    return {
      id: item.id,
      name: item.name,
      status: item.status,
      skills: parsed.success ? parsed.data.progression.map((skill) => ({ key: skill.key, name: skill.name, level: skill.level, draft: simpleDraftFromClassSkill(skill) })) : [],
      draft: parsed.success ? {
        id:item.id, name:item.name, description:parsed.data.description, specialization:parsed.data.specialization,
        difficulty:parsed.data.difficulty, primaryAttribute:parsed.data.primaryAttributes[0] ?? "FOR", imageUrl:parsed.data.imageUrl,
        resourceName:parsed.data.resource.name, resourceMaximum:parsed.data.resource.maximum,
        passiveName:parsed.data.passive.name, passiveDescription:parsed.data.passive.description,
      } satisfies SimpleClassDraft : null,
    };
  });

  const races: SimpleRaceDraft[] = (raceResult.data ?? []).flatMap((item) => {
    const parsed = parseRacePayload(item.payload); if (!parsed.success) return [];
    return [{ id:item.id, name:item.name, description:parsed.data.description, specialization:parsed.data.specialization, difficulty:parsed.data.difficulty,
      baseHp:parsed.data.baseHp, baseMana:parsed.data.baseMana, imageUrl:parsed.data.imageUrl, bonuses:parsed.data.attributeBonuses,
      traitName:parsed.data.traits[0]?.name ?? "Traço racial", traitDescription:parsed.data.traits[0]?.description ?? "Descreva o traço racial." }];
  });

  const items: SimpleItemDraft[] = [];
  const titles: SimpleTitleDraft[] = [];
  for (const row of itemResult.data ?? []) {
    const attrs = attributesSchema.safeParse(row.attributes);
    const attributes = attrs.success ? attrs.data : { FOR:0,DEF:0,RES:0,INI:0,INT:0,ARC:0 };
    const effect = parseItemSpecialEffects(row.special_effects)[0];
    if (row.slot === "title") {
      const style = objectValue(row.title_style);
      titles.push({ id:row.id, name:row.name, description:row.description ?? "Título de Wonderland.", attributes,
        primary:typeof style.primary === "string" ? style.primary : "#fff1b5", secondary:typeof style.secondary === "string" ? style.secondary : "#1f7a4c", glow:typeof style.glow === "string" ? style.glow : "#d7ad45",
        effectKind:(effect?.kind ?? "") as SimpleTitleDraft["effectKind"], effectName:effect?.name ?? "", effectDescription:effect?.description ?? "", effectPower:effect?.power ?? 0, effectDuration:effect?.duration ?? 0 });
    } else if (["head","torso","hands","legs","feet","main_weapon","off_weapon","necklace","ring","earring","cape"].includes(row.slot)) {
      items.push({ id:row.id, name:row.name, description:row.description ?? "Item de Wonderland.", category:row.category, slot:row.slot as SimpleItemDraft["slot"],
        rarity:(["common","uncommon","rare","epic","legendary","mythic"].includes(row.rarity) ? row.rarity : "common") as SimpleItemDraft["rarity"], price:row.price,
        imageUrl:row.image_url ?? "", attributes, twoHanded:Boolean(row.two_handed), effectKind:(effect?.kind ?? "") as SimpleItemDraft["effectKind"], effectName:effect?.name ?? "", effectDescription:effect?.description ?? "", effectPower:effect?.power ?? 0, effectDuration:effect?.duration ?? 0 });
    }
  }

  const missions: SimpleMissionDraft[] = (missionResult.data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    objective: row.objective,
    kingdom: row.kingdom as SimpleMissionDraft["kingdom"],
    rank: row.rank as SimpleMissionDraft["rank"],
    minLevel: row.min_level,
    isRankTrial: Boolean(row.is_rank_trial),
    promotionRank: (row.promotion_rank || null) as SimpleMissionDraft["promotionRank"],
    active: Boolean(row.active),
  }));
  const settings = (settingResult.data ?? []).map((row) => ({
    key: row.key,
    category: row.category,
    label: row.label,
    description: row.description,
    valueText: stringifySetting(row.value),
    status: row.status,
    revision: row.revision,
  }));

  const classDrafts = classes.flatMap((entry) => entry.draft ? [entry.draft] : []);
  const aiConfigured = Boolean(process.env.OPENAI_API_KEY);
  return (
    <div className="admin-content">
      <AdminCreationStudio aiConfigured={aiConfigured} classes={classes.map(({ id, name, status }) => ({ id, name, status }))} />
      <AdminContentStudio aiConfigured={aiConfigured} existing={{ classes:classDrafts, races, items, titles }} />
      <AdminOperationsStudio aiConfigured={aiConfigured} missions={missions} settings={settings} />
      <SimpleSkillLibrary classes={classes.map(({draft: _draft, ...entry}) => entry)} />
    </div>
  );
}
