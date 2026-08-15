import { requireAdministrativeAccount } from "@/lib/auth/account";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { kingdoms } from "@/lib/game/kingdoms";
import {
  kingdomOfficeLabels,
  kingdomOffices,
  kingdomStarCosts,
  kingdomUpgradeAreas,
  kingdomUpgradeAreaInfo,
} from "@/lib/game/kingdom-governance";
import { setKingdomOfficeAction, setKingdomStarsAction } from "./actions";
export const dynamic = "force-dynamic";
export const metadata = { title: "Controle de Reinos | Painel ADM" };
export default async function AdminKingdomsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; mensagem?: string }>;
}) {
  await requireAdministrativeAccount();
  const client = await createServerSupabaseClient();
  const query = await searchParams;
  const [stateResult, leadershipResult, characterResult] = client
    ? await Promise.all([
        client.from("v2_kingdom_states").select("*").order("kingdom"),
        client.from("v2_kingdom_leadership").select("*"),
        client
          .from("v2_characters")
          .select("id,name,level,kingdom,image_url,adventure_rank")
          .order("name"),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];
  const states = new Map((stateResult.data ?? []).map((item) => [item.kingdom, item]));
  const offices = new Map(
    (leadershipResult.data ?? []).map((item) => [
      `${item.kingdom}:${item.office}`,
      item.character_id,
    ]),
  );
  return (
    <div className="admin-content admin-kingdoms">
      <section className="admin-page-title">
        <span className="eyebrow">Coroas e conselho</span>
        <h2>Controle de Reinos</h2>
        <p>Defina a liderança e edite as estrelas de todas as áreas de cada reino.</p>
      </section>
      {query.status ? (
        <div className={`admin-notice ${query.status === "salvo" ? "" : "admin-notice--error"}`}>
          {query.status === "salvo"
            ? "Liderança do reino atualizada."
            : (query.mensagem ?? "Não foi possível salvar o cargo.")}
        </div>
      ) : null}
      <section className="admin-kingdom-costs">
        <h3>Custos oficiais das estrelas</h3>
        {kingdomStarCosts.map((cost, index) => (
          <span key={cost}>
            ★ {index + 1}
            <b>{cost.toLocaleString("pt-BR")} WG</b>
          </span>
        ))}
      </section>
      <section className="admin-kingdom-grid">
        {kingdoms.map((kingdom) => {
          const state = states.get(kingdom.key);
          const candidates = (characterResult.data ?? []).filter(
            (character) => character.kingdom === kingdom.key,
          );
          return (
            <article key={kingdom.key}>
              <header>
                <div>
                  <small>{kingdom.title}</small>
                  <h3>{kingdom.name}</h3>
                </div>
                <strong>Melhorias do reino</strong>
              </header>
              <div className="admin-kingdom-stars">
                {kingdomUpgradeAreas.map((area) => {
                  const value = area === "requested" ? state?.requested_stars : area === "market" ? state?.market_stars : area === "defense" ? state?.defense_stars : state?.army_stars;
                  return (
                    <form action={setKingdomStarsAction} key={area}>
                      <input name="kingdom" type="hidden" value={kingdom.key} />
                      <input name="area" type="hidden" value={area} />
                      <label>
                        <span>{kingdomUpgradeAreaInfo[area].name}</span>
                        <select name="stars" defaultValue={String(value ?? 0)}>
                          {[0, 1, 2, 3, 4, 5].map((stars) => (
                            <option value={stars} key={stars}>
                              {stars} estrela{stars === 1 ? "" : "s"}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button className="button button--small button--primary">Salvar</button>
                    </form>
                  );
                })}
              </div>
              {kingdomOffices.map((office) => (
                <form action={setKingdomOfficeAction} key={office}>
                  <input name="kingdom" type="hidden" value={kingdom.key} />
                  <input name="office" type="hidden" value={office} />
                  <label>
                    <span>{kingdomOfficeLabels[office]}</span>
                    <select
                      name="characterId"
                      defaultValue={offices.get(`${kingdom.key}:${office}`) ?? ""}
                    >
                      <option value="">Cargo vago</option>
                      {candidates.map((character) => (
                        <option value={character.id} key={character.id}>
                          {character.name} · Rank {character.adventure_rank} · Nv. {character.level}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button className="button button--small button--primary">Salvar</button>
                </form>
              ))}
            </article>
          );
        })}
      </section>
    </div>
  );
}
