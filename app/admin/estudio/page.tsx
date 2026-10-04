import { AdminContentStudio } from "@/components/admin/admin-content-studio";
import { AdminOperationsStudio } from "@/components/admin/admin-operations-studio";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { parseItemSpecialEffects } from "@/lib/game/item-effects";
import { normalizeItemAttributes } from "@/lib/game/item-attributes";
import type { SimpleItemDraft, SimpleTitleDraft } from "@/lib/admin/simple-content-builder";
import type { SimpleMissionDraft } from "@/lib/admin/simple-operations-builder";

export const dynamic = "force-dynamic";
export const metadata = { title: "Studio de itens e missões" };

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function stringifySetting(value: unknown) {
  return typeof value === "string" ? JSON.stringify(value) : JSON.stringify(value, null, 2);
}

export default async function AdminCreationStudioPage() {
  const client = await createServerSupabaseClient();
  const [itemResult, missionResult, settingResult] = client
    ? await Promise.all([
        client.from("v2_shop_items").select("*").order("name"),
        client.from("v2_missions").select("id,name,description,objective,kingdom,rank,min_level,is_rank_trial,promotion_rank,active").order("name"),
        client.from("v2_game_settings").select("key,category,label,description,value,status,revision").order("category").order("label"),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];

  const items: SimpleItemDraft[] = [];
  const titles: SimpleTitleDraft[] = [];
  for (const row of itemResult.data ?? []) {
    const normalized = normalizeItemAttributes(row.attributes);
    const attributes = { FOR: 0, DEF: 0, RES: 0, INI: 0, INT: 0, HP: 0, ...normalized };
    const effect = parseItemSpecialEffects(row.special_effects)[0];
    if (row.slot === "title") {
      const style = objectValue(row.title_style);
      titles.push({
        id: row.id, name: row.name, description: row.description ?? "Título de Wonderland.", attributes,
        primary: typeof style.primary === "string" ? style.primary : "#fff1b5",
        secondary: typeof style.secondary === "string" ? style.secondary : "#1f7a4c",
        glow: typeof style.glow === "string" ? style.glow : "#d7ad45",
        effectKind: (effect?.kind ?? "") as SimpleTitleDraft["effectKind"],
        effectName: effect?.name ?? "", effectDescription: effect?.description ?? "",
        effectPower: effect?.power ?? 0, effectDuration: effect?.duration ?? 0,
      });
    } else if (["head", "torso", "hands", "legs", "feet", "main_weapon", "off_weapon", "necklace", "ring", "earring", "cape"].includes(row.slot)) {
      items.push({
        id: row.id, name: row.name, description: row.description ?? "Item de Wonderland.",
        category: row.category, slot: row.slot as SimpleItemDraft["slot"],
        rarity: (["common", "uncommon", "rare", "epic", "legendary", "mythic"].includes(row.rarity)
          ? row.rarity : "common") as SimpleItemDraft["rarity"],
        price: row.price, imageUrl: row.image_url ?? "", attributes,
        twoHanded: Boolean(row.two_handed),
        effectKind: (effect?.kind ?? "") as SimpleItemDraft["effectKind"],
        effectName: effect?.name ?? "", effectDescription: effect?.description ?? "",
        effectPower: effect?.power ?? 0, effectDuration: effect?.duration ?? 0,
      });
    }
  }

  const missions: SimpleMissionDraft[] = (missionResult.data ?? []).map((row) => ({
    id: row.id, name: row.name, description: row.description, objective: row.objective,
    kingdom: row.kingdom as SimpleMissionDraft["kingdom"],
    rank: row.rank as SimpleMissionDraft["rank"],
    minLevel: row.min_level, isRankTrial: Boolean(row.is_rank_trial),
    promotionRank: (row.promotion_rank || null) as SimpleMissionDraft["promotionRank"],
    active: Boolean(row.active),
  }));
  const settings = (settingResult.data ?? []).map((row) => ({
    key: row.key, category: row.category, label: row.label, description: row.description,
    valueText: stringifySetting(row.value), status: row.status, revision: row.revision,
  }));
  const aiConfigured = Boolean(process.env.OPENAI_API_KEY);

  return (
    <div className="admin-content">
      <AdminContentStudio aiConfigured={aiConfigured} existing={{ items, titles }} />
      <AdminOperationsStudio aiConfigured={aiConfigured} missions={missions} settings={settings} />
    </div>
  );
}
