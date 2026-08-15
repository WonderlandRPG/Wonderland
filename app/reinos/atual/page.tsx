import Link from "next/link";
import { PlayerNav } from "@/components/player-nav";
import { requireActiveCharacter } from "@/lib/content/active-character";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { kingdomName, kingdoms } from "@/lib/game/kingdoms";
import {
  kingdomOfficeLabels,
  kingdomUpgradeAreaInfo,
  parseCurrentKingdom,
} from "@/lib/game/kingdom-governance";
import { buyKingdomStarAction, declareKingdomWarAction, respondKingdomWarAction } from "./actions";
export const dynamic = "force-dynamic";
export const metadata = { title: "Reino Atual | Wonderland" };
export default async function CurrentKingdomPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; mensagem?: string }>;
}) {
  const { characterId } = await requireActiveCharacter("/reinos/atual");
  const client = await createServerSupabaseClient();
  const query = await searchParams;
  const { data, error } = client
    ? await client.rpc("v2_get_current_kingdom", { p_character_id: characterId })
    : { data: null, error: null };
  const state = parseCurrentKingdom(data);
  return (
    <main className="kingdom-current-page">
      <PlayerNav />
      <div className="page-container kingdom-current-shell">
        <header className="kingdom-current-hero">
          <div>
            <span className="eyebrow">Coroa e progresso coletivo</span>
            <h1>{state ? kingdomName(state.kingdom) : "Reino atual"}</h1>
            <p>
              A liderança e todos os habitantes fortalecem o mesmo reino. Cada estrela melhora as
              recompensas de seus aventureiros.
            </p>
          </div>
          <Link className="button button--glass" href="/reinos">
            Explorar todos os reinos
          </Link>
        </header>
        {query.status ? (
          <div
            className={`admin-notice ${query.status === "comprada" ? "" : "admin-notice--error"}`}
          >
            {query.status === "comprada"
              ? "★ Uma nova estrela foi conquistada pelo reino."
              : (query.mensagem ?? "Não foi possível comprar a estrela.")}
          </div>
        ) : null}
        {error || !state ? (
          <section className="kingdom-empty">
            <h2>Estado do reino indisponível</h2>
            <p>{error?.message ?? "Selecione um personagem ativo."}</p>
          </section>
        ) : (
          <>
            <section className="kingdom-leadership">
              <header>
                <span className="eyebrow">Conselho da Coroa</span>
                <h2>Liderança atual</h2>
              </header>
              <div>
                {(["monarch", "realm_councilor", "war_councilor"] as const).map((office) => {
                  const leader = state.leadership.find((entry) => entry.office === office);
                  return (
                    <article key={office}>
                      {leader?.imageUrl ? (
                        <span
                          className="is-image"
                          style={{ backgroundImage: `url(${leader.imageUrl})` }}
                        />
                      ) : (
                        <span>{leader?.name.slice(0, 2).toUpperCase() ?? "—"}</span>
                      )}
                      <small>{kingdomOfficeLabels[office]}</small>
                      {leader ? (
                        <>
                          <strong>{leader.name}</strong>
                          <p>
                            Rank {leader.rank} · Nível {leader.level}
                          </p>
                          <Link href={`/jogadores/${leader.characterId}`}>Ver perfil →</Link>
                        </>
                      ) : (
                        <>
                          <strong>Cargo vago</strong>
                          <p>Aguardando nomeação administrativa.</p>
                        </>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
            {state.penalty ? (
              <section className="kingdom-war-alert">
                <h2>Consequências de guerra ativas</h2>
                <p>Até {new Date(state.penalty.until).toLocaleString("pt-BR")}, os moradores deste reino possuem {state.penalty.rewardPercent ? `-${state.penalty.rewardPercent}% nas recompensas de XP e WG` : "recompensas normais"}{state.penalty.shopPercent ? ` e +${state.penalty.shopPercent}% nos preços da Loja` : ""}.</p>
              </section>
            ) : null}
            <section className="kingdom-war-panel">
              <header><span className="eyebrow">Conflitos entre reinos</span><h2>Guerras</h2></header>
              {state.wars.filter((war) => war.status === "pending" && war.defender === state.kingdom).map((war) => (
                <article className="kingdom-war-request" key={war.id}>
                  <h3>{kingdomName(war.attacker)} declarou guerra ao seu reino. O que deseja fazer?</h3>
                  <p><b>Render-se:</b> todos os moradores perdem 50% do WG e recebem -30% de XP e WG durante 7 dias.</p>
                  <p><b>Lutar:</b> vence a maior soma de Exército + Defesas. No empate, vence quem tiver mais moradores acima do nível 50; persistindo o empate, o defensor vence.</p>
                  {state.ownOffice === "monarch" ? <div>
                    <form action={respondKingdomWarAction}><input type="hidden" name="warId" value={war.id}/><input type="hidden" name="response" value="surrender"/><button className="button button--glass">Render-se</button></form>
                    <form action={respondKingdomWarAction}><input type="hidden" name="warId" value={war.id}/><input type="hidden" name="response" value="fight"/><button className="button button--primary">Lutar</button></form>
                  </div> : <small>Somente o Rei ou a Rainha pode responder.</small>}
                </article>
              ))}
              {state.ownOffice === "monarch" && !state.wars.some((war) => war.status === "pending") ? (
                <details className="kingdom-war-declare"><summary className="button button--danger">Declarar guerra</summary>
                  <div><h3>Escolha o reino adversário</h3>
                    <p>A luta compara Exército + Defesas. Empates são decididos pelos moradores acima do nível 50 e, em empate absoluto, pelo defensor.</p>
                    <p>O derrotado perde todo o WG, todas as estrelas e paga 50% a mais na Loja por 7 dias. Os efeitos atingem somente os moradores do reino derrotado.</p>
                    <form action={declareKingdomWarAction}><select name="defender" required><option value="">Selecione um reino</option>{kingdoms.filter((item) => item.key !== state.kingdom).map((item) => <option key={item.key} value={item.key}>{item.name}</option>)}</select><button className="button button--danger">Confirmar declaração</button></form>
                  </div>
                </details>
              ) : null}
            </section>
            <section className="kingdom-upgrade-grid">
              {state.areas.map((area) => (
                <article className="kingdom-upgrade" key={area.key}>
                  <div>
                    <span className="eyebrow">Melhoria do reino</span>
                    <h2>{kingdomUpgradeAreaInfo[area.key].name}</h2>
                    <p>{kingdomUpgradeAreaInfo[area.key].description}</p>
                    <div className="kingdom-stars" aria-label={`${area.stars} de 5 estrelas`}>
                      {Array.from({ length: 5 }, (_, i) => (
                        <span className={i < area.stars ? "is-active" : ""} key={i}>
                          ★
                        </span>
                      ))}
                    </div>
                    <strong>{area.key === "market" ? `Desconto atual: -${area.bonusPercent}%` : area.key === "requested" ? `Bônus atual: +${area.bonusPercent}%` : `${area.stars} de 5 níveis militares`}</strong>
                  </div>
                  <aside>
                    <small>Próxima estrela</small>
                    <strong>
                      {area.nextStarCost === null
                        ? "Nível máximo"
                        : `${area.nextStarCost.toLocaleString("pt-BR")} WG`}
                    </strong>
                    <p>Saldo do Rei/Rainha: {state.characterGold.toLocaleString("pt-BR")} WG</p>
                    {state.ownOffice === "monarch" && area.nextStarCost !== null ? (
                      <form action={buyKingdomStarAction}>
                        <input type="hidden" name="area" value={area.key} />
                        <button
                          className="button button--primary"
                          disabled={state.characterGold < area.nextStarCost}
                        >
                          Comprar estrela
                        </button>
                      </form>
                    ) : (
                      <span className="kingdom-upgrade__lock">
                        Somente o Rei ou a Rainha pode realizar a compra.
                      </span>
                    )}
                  </aside>
                </article>
              ))}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
