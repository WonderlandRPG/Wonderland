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
import { setKingdomOfficeAction, setKingdomStarsAction,setKingdomEconomyAction } from "./actions";
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
  const economyResult=client?await (client.rpc as unknown as (name:string,args?:Record<string,unknown>)=>Promise<{data:Record<string,number>|null}>)("v2_admin_get_kingdom_economy"): {data:null};
  const economy=economyResult.data??{};
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
      <section className="admin-section admin-kingdom-economy"><header><div><small>ECONOMIA SEMANAL</small><h3>Salários, consumo e recursos</h3><p>Configure os valores aplicados aos domingos e o custo de recuperação de 1%.</p></div></header><form className="admin-form" action={setKingdomEconomyAction}><div className="admin-form-grid"><label>Salário Rei/Rainha<input name="monarchSalary" inputMode="numeric" defaultValue={String(economy.monarch_salary??50000)}/></label><label>Salário Conselheiro do Reino<input name="realmSalary" inputMode="numeric" defaultValue={String(economy.realm_councilor_salary??25000)}/></label><label>Salário Conselheiro de Guerra<input name="warSalary" inputMode="numeric" defaultValue={String(economy.war_councilor_salary??25000)}/></label><label>Limite semanal por área (%)<input name="weeklyLimit" type="number" min="1" max="100" defaultValue={economy.weekly_purchase_limit??25}/></label></div><div className="admin-form-grid">{[["infrastructure","Infraestrutura"],["provisions","Provisões"],["arsenal","Arsenal"],["livestock","Criação"]].map(([key,label])=><fieldset key={key}><legend>{label}</legend><label>Consumo domingo (%)<input name={`${key}Drain`} type="number" min="0" max="100" defaultValue={economy[`${key}_drain`]??10}/></label><label>Custo por 1%<input name={`${key}Cost`} inputMode="numeric" defaultValue={String(economy[`${key}_cost`]??15000)}/></label></fieldset>)}</div><button className="button button--primary">Salvar economia dos reinos</button></form></section>
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
