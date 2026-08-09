import { getLevelProgress } from "@/lib/game/experience";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { updateCharacterAdminAction } from "./actions";
import { kingdoms } from "@/lib/game/kingdoms";

export const metadata = { title: "Personagens | Painel ADM" };
export const dynamic = "force-dynamic";

export default async function AdminCharactersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const client = await createServerSupabaseClient();
  const [{ data: characters }, query] = await Promise.all([
    client
      ? client
          .from("v2_characters")
          .select("id,name,level,xp,gold,image_url,kingdom,race_id,class_id,user_id")
          .order("name")
      : Promise.resolve({ data: [] }),
    searchParams,
  ]);
  const contentIds = [
    ...new Set((characters ?? []).flatMap((entry) => [entry.race_id, entry.class_id])),
  ];
  const { data: content } =
    client && contentIds.length
      ? await client.from("v2_content").select("id,name").in("id", contentIds)
      : { data: [] };
  const names = new Map((content ?? []).map((entry) => [entry.id, entry.name]));
  return (
    <div className="admin-content">
      <section className="admin-page-title">
        <span className="eyebrow">Fichas do mundo</span>
        <h2>Editar personagens</h2>
        <p>
          Altere nome, XP, WG e retrato. O nível é calculado automaticamente pela tabela oficial.
        </p>
      </section>
      {query.status ? (
        <div className={`account-notice ${query.status === "erro" ? "is-warning" : ""}`}>
          {query.status === "salvo" ? "✓ Personagem atualizado." : "! Não foi possível salvar."}
        </div>
      ) : null}
      <section className="admin-character-grid">
        {(characters ?? []).map((character) => {
          const progress = getLevelProgress(character.xp);
          return (
            <article className="admin-character-card" key={character.id}>
              <header>
                {character.image_url ? (
                  <span
                    className="is-image"
                    role="img"
                    aria-label={`Retrato de ${character.name}`}
                    style={{ backgroundImage: `url(${character.image_url})` }}
                  />
                ) : (
                  <span>{character.name.slice(0, 2).toUpperCase()}</span>
                )}
                <div>
                  <small>
                    {names.get(character.race_id)} · {names.get(character.class_id)}
                  </small>
                  <h3>{character.name}</h3>
                  <p>
                    Nível {character.level} · próximo nível em{" "}
                    {progress.next.toLocaleString("pt-BR")} XP
                  </p>
                </div>
              </header>
              <form className="admin-form" action={updateCharacterAdminAction}>
                <input name="characterId" type="hidden" value={character.id} />
                <label>
                  <span>Nome</span>
                  <input name="name" defaultValue={character.name} required />
                </label>
                <label>
                  <span>XP total</span>
                  <input name="xp" type="number" min="0" defaultValue={character.xp} required />
                </label>
                <label>
                  <span>Wonderland Gold</span>
                  <input name="gold" type="number" min="0" defaultValue={character.gold} required />
                </label>
                <label>
                  <span>Reino de origem</span>
                  <select name="kingdom" defaultValue={character.kingdom} required>
                    {kingdoms.map((kingdom) => (
                      <option key={kingdom.key} value={kingdom.key}>
                        {kingdom.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Link da imagem</span>
                  <input
                    name="imageUrl"
                    type="url"
                    defaultValue={character.image_url ?? ""}
                    placeholder="https://..."
                  />
                </label>
                <button className="button button--primary">Salvar personagem</button>
              </form>
            </article>
          );
        })}
      </section>
    </div>
  );
}
