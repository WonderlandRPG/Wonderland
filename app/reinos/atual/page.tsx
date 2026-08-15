import Link from "next/link";
import { PlayerNav } from "@/components/player-nav";
import { requireActiveCharacter } from "@/lib/content/active-character";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { kingdomName } from "@/lib/game/kingdoms";
import {
  kingdomOfficeLabels,
  kingdomUpgradeAreaInfo,
  parseCurrentKingdom,
} from "@/lib/game/kingdom-governance";
import { buyKingdomStarAction } from "./actions";
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
            <section className="kingdom-upgrade-grid">
              {state.areas.map((area) => (
                <article className="kingdom-upgrade" key={area.key}>
                  <div>
                    <span className="eyebrow">Melhoria do reino</span>
                    <h2>{kingdomUpgradeAreaInfo[area.key].name}</h2>
                    <p>
                      {kingdomUpgradeAreaInfo[area.key].description} em PvP, PvE, Missões e
                      Dungeons.
                    </p>
                    <div className="kingdom-stars" aria-label={`${area.stars} de 5 estrelas`}>
                      {Array.from({ length: 5 }, (_, i) => (
                        <span className={i < area.stars ? "is-active" : ""} key={i}>
                          ★
                        </span>
                      ))}
                    </div>
                    <strong>Bônus atual: +{area.bonusPercent}%</strong>
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
