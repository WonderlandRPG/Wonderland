import { BestiaryCatalog } from "@/components/bestiary/bestiary-catalog";
import { PlayerNav } from "@/components/player-nav";
import { requireActiveCharacter } from "@/lib/content/active-character";
import type { BestiaryCreature, CreatureRank } from "@/lib/game/bestiary";
import { parseTextList } from "@/lib/game/bestiary";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata = { title: "Bestiário de Wonderland" };
export const dynamic = "force-dynamic";

export default async function BestiaryPage({
  searchParams,
}: {
  searchParams: Promise<{ criatura?: string }>;
}) {
  await requireActiveCharacter("/bestiario");
  const query = await searchParams;
  const client = await createServerSupabaseClient();
  const { data } = client
    ? await client.from("v2_creatures").select("*").eq("active", true).order("rank").order("name")
    : { data: [] };
  const creatures: BestiaryCreature[] = (data ?? []).map((entry) => ({
    id: entry.id,
    slug: entry.slug,
    name: entry.name,
    category: entry.category,
    rank: entry.rank as CreatureRank,
    size: entry.size,
    disposition: entry.disposition,
    behavior: entry.behavior,
    weaknesses: parseTextList(entry.weaknesses),
    habitats: parseTextList(entry.habitats),
    description: entry.description,
  }));

  return (
    <main className="bestiary-page">
      <PlayerNav />
      <div className="page-container bestiary-shell">
        <header className="bestiary-hero">
          <div>
            <span className="eyebrow">Arquivo de criaturas da Guilda</span>
            <h1>
              Bestiário de <em>Wonderland</em>
            </h1>
            <p>
              Registros de campo sobre feras, monstros e entidades encontrados nos seis Reinos.
              Conhecer o comportamento e a fraqueza de uma criatura pode decidir o resultado de uma
              missão.
            </p>
          </div>
          <aside>
            <small>ESPÉCIES CATALOGADAS</small>
            <strong>{creatures.length}</strong>
            <span>Ranks E a EX</span>
          </aside>
        </header>
        <BestiaryCatalog
          creatures={creatures}
          initialQuery={creatures.find((creature) => creature.slug === query.criatura)?.name ?? ""}
        />
      </div>
    </main>
  );
}
