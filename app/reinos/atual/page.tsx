import Link from "next/link";
import { PlayerNav } from "@/components/player-nav";
import { requireActiveCharacter } from "@/lib/content/active-character";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { kingdomName, kingdoms } from "@/lib/game/kingdoms";
import {
  kingdomOfficeLabels,
  kingdomOffices,
  kingdomResourceInfo,
  kingdomUpgradeAreaInfo,
  parseCurrentKingdom,
  parseKingdomExpansion,
} from "@/lib/game/kingdom-governance";
import { buyKingdomStarAction, declareKingdomWarAction, respondKingdomWarAction,donateToKingdomAction,buyKingdomResourceAction,proposePeaceAction,respondPeaceAction,startCrownVoteAction,castCrownVoteAction } from "./actions";
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
  const [{data,error},{data:expansionData}]=client?await Promise.all([client.rpc("v2_get_current_kingdom",{p_character_id:characterId}),client.rpc("v2_get_kingdom_expansion" as never,{p_character_id:characterId} as never)]):[{data:null,error:null},{data:null}];
  const state = parseCurrentKingdom(data);
  const expansion=parseKingdomExpansion(expansionData);
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
            {expansion ? <>
              <section className="kingdom-treasury"><div><span className="eyebrow">Fundo coletivo</span><h2>Fundo Real</h2><p>Moradores podem doar WG para salários, recursos e estrelas. As estrelas usam primeiro o Fundo Real e depois o WG do monarca.</p><strong>{expansion.treasury.toLocaleString("pt-BR")} WG</strong></div><form action={donateToKingdomAction}><label>Valor da doação<input name="amount" type="number" min="1" required/></label><button className="button button--primary">Doar ao reino</button></form></section>
              <section className="kingdom-salaries"><header><span className="eyebrow">Pagamento dominical</span><h2>Salários da Coroa</h2><p>Todo domingo, os cargos recebem seus salários usando o saldo disponível no Fundo Real.</p></header><div>{kingdomOffices.map(office=><article key={office}><small>{kingdomOfficeLabels[office]}</small><strong>{expansion.salaries[office].toLocaleString("pt-BR")} WG</strong></article>)}</div></section>
              <section className="kingdom-resources"><header><span className="eyebrow">Sustento do território</span><h2>Recursos do Reino</h2><p>As reservas diminuem aos domingos. O monarca pode recuperar até {expansion.weeklyLimit}% de cada área por semana e possui 24 horas após o consumo semanal para reorganizar as contas.</p></header><div>{expansion.resources.map(resource=><article className={resource.value<60?"is-critical":""} key={resource.key}><h3>{kingdomResourceInfo[resource.key].name}</h3><p>{kingdomResourceInfo[resource.key].description}</p><div className="kingdom-resource-bar"><i style={{width:`${resource.value}%`}}/><span>{resource.value}%</span></div><small>Consumo semanal: -{resource.drain}% · {resource.cost.toLocaleString("pt-BR")} WG por 1%</small><b>{resource.penalty}</b>{expansion.ownOffice==="monarch"?<form action={buyKingdomResourceAction}><input name="resource" type="hidden" value={resource.key}/><input name="beneficiary" type="hidden" value=""/><input name="percent" type="number" min="1" max={Math.min(25,100-resource.value)} defaultValue="1" required/><button className="button button--small button--primary">Comprar porcentagem</button></form>:null}</article>)}</div>
              {expansion.ownOffice==="monarch"&&expansion.peaceAgreements.length?<aside className="kingdom-ally-help"><h3>Ajuda aos aliados</h3><p>Com um acordo de paz, seu reino pode comprar até 6% semanais de uma reserva aliada.</p><form action={buyKingdomResourceAction}><select name="beneficiary">{expansion.peaceAgreements.map(a=><option value={a.kingdom} key={a.id}>{kingdomName(a.kingdom)}</option>)}</select><select name="resource">{Object.entries(kingdomResourceInfo).map(([key,value])=><option value={key} key={key}>{value.name}</option>)}</select><input name="percent" type="number" min="1" max="6" defaultValue="1"/><button className="button button--primary">Ajudar aliado</button></form></aside>:null}</section>
              <section className="kingdom-diplomacy"><header><span className="eyebrow">Diplomacia Real</span><h2>Acordos de Paz</h2><p>O reino destinatário possui 48 horas para responder. Sem resposta, a proposta é negada automaticamente.</p></header>{expansion.peaceAgreements.map(a=><p key={a.id}>✦ Acordo ativo com <b>{kingdomName(a.kingdom)}</b>.</p>)}{expansion.peaceProposals.filter(p=>p.status==="pending"&&p.recipient===state.kingdom).map(p=><article key={p.id}><p><b>{kingdomName(p.proposer)}</b> propôs um acordo de paz. Expira em {new Date(p.expiresAt).toLocaleString("pt-BR")}.</p>{expansion.ownOffice==="monarch"?<div><form action={respondPeaceAction}><input name="proposalId" type="hidden" value={p.id}/><input name="accept" type="hidden" value="true"/><button className="button button--primary">Aceitar</button></form><form action={respondPeaceAction}><input name="proposalId" type="hidden" value={p.id}/><input name="accept" type="hidden" value="false"/><button className="button button--danger">Negar</button></form></div>:null}</article>)}{expansion.ownOffice==="monarch"?<details><summary className="button button--glass">Propor acordo de paz</summary><form action={proposePeaceAction}><select name="kingdom">{kingdoms.filter(k=>k.key!==state.kingdom&&!expansion.peaceAgreements.some(a=>a.kingdom===k.key)).map(k=><option value={k.key} key={k.key}>{k.name}</option>)}</select><button className="button button--primary">Enviar proposta</button></form></details>:null}</section>
              <section className="kingdom-crown-votes"><header><span className="eyebrow">Voz dos moradores</span><h2>Desmembrar a Coroa</h2><p>Uma votação dura 48 horas. O cargo é removido quando os votos “Sim” ultrapassam metade de todos os personagens do reino.</p></header>{expansion.votes.map(v=><article key={v.id}><h3>{kingdomOfficeLabels[v.office]}</h3><p>{v.yes} Sim · {v.no} Não · necessários {Math.floor(v.residents/2)+1} de {v.residents} moradores</p><progress max={Math.floor(v.residents/2)+1} value={v.yes}/><small>Termina em {new Date(v.expiresAt).toLocaleString("pt-BR")}</small><div><form action={castCrownVoteAction}><input name="voteId" type="hidden" value={v.id}/><input name="choice" type="hidden" value="true"/><button className="button button--primary">Votar Sim</button></form><form action={castCrownVoteAction}><input name="voteId" type="hidden" value={v.id}/><input name="choice" type="hidden" value="false"/><button className="button button--glass">Votar Não</button></form></div></article>)}<div className="kingdom-crown-start">{kingdomOffices.filter(o=>!expansion.votes.some(v=>v.office===o)&&state.leadership.some(l=>l.office===o)).map(o=><form action={startCrownVoteAction} key={o}><input name="office" type="hidden" value={o}/><button className="button button--danger">Votar para remover {kingdomOfficeLabels[o]}</button></form>)}</div></section>
            </>:null}
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
                  <small>Prazo de resposta: 48 horas. Sem resposta, o reino se renderá automaticamente.</small>
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
                    <p>A luta compara Exército + Defesas. No empate, compara a soma de Infraestrutura, Provisões, Arsenal e Criação. Depois, a quantidade de moradores acima do nível 50; persistindo o empate, o defensor vence.</p>
                    <p>O reino atacado possui 48 horas para responder. Sem resposta, render-se-á automaticamente.</p>
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
