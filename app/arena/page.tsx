import { TacticalCombatShell } from "@/components/arena/tactical-combat-shell";
import { PlayerNav } from "@/components/player-nav";
import { getCharacterSheets } from "@/lib/content/characters";
import { requireActiveCharacter } from "@/lib/content/active-character";
import { arenaRewards, type ArenaMode } from "@/lib/game/arena";
import Link from "next/link";
import {
  claimArenaVictoryAction,
  finishArenaDefeatAction,
  savePveBattleStateAction,
  startPveAction,
} from "./actions";
import type { TacticalBattleSnapshot } from "@/components/arena/tactical-combat-core";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { leaveAllQueuesAction } from "@/app/arena/queue-actions";
import { CombatExitGuard } from "@/components/arena/combat-exit-guard";
import { getCreatureImageUrl, parseTextList } from "@/lib/game/bestiary";
import { parseCreatureCombatProfile } from "@/lib/game/creature-tactical-combat";
import { toTacticalArenaCharacter } from "@/lib/game/arena-character";

export const metadata = { title: "Arena" };
export const dynamic = "force-dynamic";

export default async function ArenaPage({
  searchParams,
}: {
  searchParams: Promise<{
    personagem?: string;
    modo?: string;
    partida?: string;
    filas?: string;
    quantidade?: string;
    mensagem?: string;
    sessao?: string;
  }>;
}) {
  const { account, characterId } = await requireActiveCharacter("/arena");
  const [characters, query] = await Promise.all([getCharacterSheets(account.id), searchParams]);
  const mode = (["pve", "pvp"] as const).includes(query.modo as ArenaMode)
    ? (query.modo as ArenaMode)
    : null;
  const activeCharacter = characters.find((character) => character.id === characterId);
  const client = activeCharacter ? await createServerSupabaseClient() : null;
  const { data: missionLock } =
    client && activeCharacter
      ? await client
          .from("v2_mission_assignments")
          .select("id")
          .eq("character_id", activeCharacter.id)
          .eq("status", "in_progress")
          .maybeSingle()
      : { data: null };
  if (missionLock)
    return (
      <main className="arena-page">
        <PlayerNav />
        <div className="page-container arena-page__inner">
          <section className="arena-mission-lock">
            <span>✥</span>
            <small>CONTRATO ATIVO</small>
            <h1>A Guilda requer sua atenção</h1>
            <p>
              Enquanto uma missão estiver em andamento, este personagem não pode participar de PvE
              ou PvP.
            </p>
            <Link className="button button--primary" href="/missoes">
              Voltar ao Mural de Missões
            </Link>
          </section>
        </div>
      </main>
    );
  const sessionQuery = z.uuid().safeParse(query.sessao);
  const arenaSessionResult =
    client && activeCharacter && mode === "pve" && sessionQuery.success
      ? await client
          .from("v2_arena_sessions")
          .select("id,status,creature_id,map_id,battle_state")
          .eq("id", sessionQuery.data)
          .eq("character_id", activeCharacter.id)
          .eq("user_id", account.id)
          .eq("mode", "pve")
          .eq("status", "open")
          .maybeSingle()
      : { data: null, error: null };
  const arenaSessionId = arenaSessionResult.data?.id ?? null;
  const arenaSessionError =
    mode === "pve" && !arenaSessionId
      ? {
          message:
            arenaSessionResult.error?.message ??
            "Volte à Arena e clique em Entrar no PvE para iniciar ou retomar uma luta.",
        }
      : null;
  const { data: pveCreatureRows } =
    client && activeCharacter && mode === "pve" && !arenaSessionError
      ? await client
          .from("v2_creatures")
          .select("*")
          .eq("active", true)
          .eq("rank", activeCharacter.adventure_rank)
          .order("slug")
          .limit(50)
      : { data: [] };
  const selectedCreatureRows = arenaSessionResult.data?.creature_id
    ? (pveCreatureRows ?? []).filter((row) => row.id === arenaSessionResult.data?.creature_id)
    : [];
  const tacticalCreatures = selectedCreatureRows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    rank: row.rank,
    behavior: row.behavior,
    weaknesses: parseTextList(row.weaknesses),
    description: row.description,
    imageUrl: getCreatureImageUrl(row.slug),
    combatProfile: parseCreatureCombatProfile(
      row.rank,
      (row as typeof row & { combat_profile?: unknown }).combat_profile,
    ),
  }));
  const pveStatusResult =
    client && activeCharacter
      ? await client.rpc("v2_get_pve_daily_status", { p_character_id: activeCharacter.id })
      : { data: null };
  const rawPveStatus =
    pveStatusResult.data &&
    !Array.isArray(pveStatusResult.data) &&
    typeof pveStatusResult.data === "object"
      ? pveStatusResult.data
      : null;
  const pveStatus = rawPveStatus
    ? {
        limit: Number(rawPveStatus.limit ?? 5),
        used: Number(rawPveStatus.used ?? 0),
        remaining: Number(rawPveStatus.remaining ?? 5),
        activeSessionId:
          typeof rawPveStatus.activeSessionId === "string" ? rawPveStatus.activeSessionId : null,
      }
    : null;
  const tacticalCharacters = activeCharacter ? [toTacticalArenaCharacter(activeCharacter)] : [];
  const rawBattleState = arenaSessionResult.data?.battle_state;
  const initialBattleState =
    rawBattleState &&
    typeof rawBattleState === "object" &&
    !Array.isArray(rawBattleState) &&
    rawBattleState.version === 1 &&
    typeof rawBattleState.mapId === "string"
      ? (rawBattleState as unknown as TacticalBattleSnapshot)
      : null;

  return (
    <main className="arena-page">
      <PlayerNav />
      <div className="page-container arena-page__inner">
        {!mode ? (
          <section className="arena-mode-select">
            <header>
              <span className="eyebrow">Portal de combate</span>
              <h1>Escolha seu modo</h1>
              <p>Cada modalidade usa a ficha e os equipamentos do personagem selecionado.</p>
            </header>
            <Link className="arena-history-link" href="/arena/historico">
              Ver histórico de vitórias e derrotas →
            </Link>
            <aside className="arena-queue-cleanup">
              <div>
                <small>GERENCIAMENTO DE FILAS</small>
                <strong>Vai aceitar uma missão?</strong>
                <p>Encerre de uma vez filas e combates pendentes de PvE e PvP.</p>
              </div>
              <form action={leaveAllQueuesAction}>
                <button className="button button--danger" type="submit">
                  Sair de todas as filas
                </button>
              </form>
            </aside>
            {query.filas === "limpas" ? (
              <p className="arena-queue-notice is-success" role="status">
                {Number(query.quantidade) > 0
                  ? `${Number(query.quantidade)} atividade(s) encerrada(s). Agora você pode aceitar uma missão.`
                  : "Nenhuma fila ou combate pendente foi encontrado. Você já pode aceitar uma missão."}
              </p>
            ) : null}
            {query.filas === "erro" ? (
              <p className="arena-queue-notice is-error" role="alert">
                {query.mensagem || "Não foi possível sair das filas. Tente novamente."}
              </p>
            ) : null}
            {query.filas === "ativas" ? (
              <p className="arena-queue-notice is-error" role="alert">
                Existe um combate iniciado recentemente. Encerre a luta antes de aceitar uma missão.
              </p>
            ) : null}
            {query.mensagem && !query.filas ? (
              <p className="arena-queue-notice is-error" role="alert">
                {query.mensagem}
              </p>
            ) : null}
            <div className="arena-mode-grid">
              {pveStatus?.remaining === 0 && !pveStatus.activeSessionId ? (
                <article className="arena-mode-locked">
                  <span>獣</span>
                  <small>Limite diário atingido</small>
                  <strong>PvE</strong>
                  <p>Este personagem já realizou as {pveStatus.limit} expedições de hoje.</p>
                  <b>Reinício à meia-noite de Brasília</b>
                </article>
              ) : (
                <form action={startPveAction} className="arena-mode-card is-pve">
                  <span className="arena-mode-card__sigil">獣</span>
                  <i>01</i>
                  <small>
                    {pveStatus
                      ? `${pveStatus.remaining} de ${pveStatus.limit} entradas restantes`
                      : "5 entradas por dia"}
                  </small>
                  <strong>PvE</strong>
                  <p>Enfrente um monstro do seu nível e com o mesmo total de atributos.</p>
                  <b>
                    {activeCharacter
                      ? `+${arenaRewards[activeCharacter.adventure_rank as keyof typeof arenaRewards].xp.toLocaleString("pt-BR")} XP`
                      : "Entrar"}{" "}
                    →
                  </b>
                  <button className="button button--primary" type="submit">
                    {pveStatus?.activeSessionId ? "Retomar PvE" : "Entrar no PvE"}
                  </button>
                </form>
              )}
              <article className="arena-mode-locked is-pvp">
                <span className="arena-mode-card__sigil">対</span>
                <i>02</i>
                <small>Conversão tática em andamento</small>
                <strong>PvP</strong>
                <p>O combate legado foi desativado. O novo PvP tático chegará no item 11.</p>
                <b>Indisponível temporariamente</b>
              </article>
            </div>
          </section>
        ) : null}
        {mode === "pve" && arenaSessionError ? (
          <section className="arena-load-error" role="alert">
            <span>!</span>
            <div>
              <strong>Não foi possível iniciar o PvE</strong>
              <p>
                {arenaSessionError.message ||
                  "A sessão de combate não foi criada. Tente novamente em alguns instantes."}
              </p>
            </div>
            <Link href="/arena">Voltar aos modos</Link>
          </section>
        ) : null}
        {mode === "pvp" ? (
          <section className="arena-load-error" role="alert">
            <span>!</span>
            <div>
              <strong>PvP antigo desativado</strong>
              <p>
                O modo competitivo será reaberto somente com o mapa e as regras do Rework no item
                11.
              </p>
            </div>
            <Link href="/arena">Voltar aos modos</Link>
          </section>
        ) : null}
        {mode === "pve" && !arenaSessionError ? (
          <>
            <Link className="arena-mode-back" href="/arena">
              ← Trocar modo
            </Link>
            <>
              {typeof arenaSessionId === "string" ? (
                <CombatExitGuard kind="arena" combatId={arenaSessionId} />
              ) : null}
              <TacticalCombatShell
                characters={tacticalCharacters}
                creatures={tacticalCreatures}
                initialMapId={arenaSessionResult.data?.map_id}
                onVictory={
                  arenaSessionId ? claimArenaVictoryAction.bind(null, arenaSessionId) : undefined
                }
                onDefeat={
                  arenaSessionId ? finishArenaDefeatAction.bind(null, arenaSessionId) : undefined
                }
                initialState={initialBattleState}
                onCheckpoint={
                  arenaSessionId ? savePveBattleStateAction.bind(null, arenaSessionId) : undefined
                }
              />
            </>
          </>
        ) : null}
      </div>
    </main>
  );
}
