import { TrainingArena } from "@/components/arena/training-arena";
import { PlayerNav } from "@/components/player-nav";
import { getCharacterSheets, getPvpOpponentSheet } from "@/lib/content/characters";
import { requireActiveCharacter } from "@/lib/content/active-character";
import { defaultCombatRules } from "@/lib/game/combat";
import { PvpLobby } from "@/components/arena/pvp-lobby";
import { arenaRewards, type ArenaMode } from "@/lib/game/arena";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { toArenaCharacter } from "@/lib/game/arena-character";
import { createInitialPvpState } from "@/lib/game/pvp-state";
import { PvpBattle } from "@/components/arena/pvp-battle";
import type { Json } from "@/lib/db/types";
import { isAdministrativeRole } from "@/lib/auth/roles";
import { leaveAllQueuesAction } from "@/app/arena/queue-actions";

export const metadata = { title: "Arena de Treinamento" };
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
  }>;
}) {
  const { account, characterId } = await requireActiveCharacter("/arena");
  const [characters, query] = await Promise.all([getCharacterSheets(account.id), searchParams]);
  const mode = (["training", "pve", "pvp"] as const).includes(query.modo as ArenaMode)
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
              Enquanto uma missão estiver em andamento, este personagem não pode participar de
              Treino, PvE, PvP ou Dungeons.
            </p>
            <Link className="button button--primary" href="/missoes">
              Voltar ao Mural de Missões
            </Link>
          </section>
        </div>
      </main>
    );
  const arenaSessionResult =
    client && activeCharacter && mode === "pve"
      ? await client.rpc("v2_start_arena_session", {
          p_character_id: activeCharacter.id,
          p_mode: "pve",
        })
      : { data: null };
  const arenaSessionId = arenaSessionResult.data;
  const arenaSessionError = "error" in arenaSessionResult ? arenaSessionResult.error : null;
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
      }
    : null;
  const opponent =
    mode === "pvp" && query.partida ? await getPvpOpponentSheet(query.partida) : null;
  const pvpMatchError =
    query.partida && !opponent
      ? "A sala foi encontrada, mas não foi possível carregar o adversário. Volte à fila e tente novamente."
      : null;
  const arenaCharacter = activeCharacter ? toArenaCharacter(activeCharacter) : null;
  const arenaOpponent = opponent ? toArenaCharacter(opponent) : null;
  let pvpRoom = null;
  if (client && mode === "pvp" && query.partida && arenaCharacter && arenaOpponent) {
    const initialState = createInitialPvpState(arenaCharacter, arenaOpponent, defaultCombatRules);
    await client.rpc("v2_initialize_pvp_match", {
      p_match_id: query.partida,
      p_state: initialState as unknown as Json,
    });
    const roomResult = await client.rpc("v2_get_pvp_match_state", { p_match_id: query.partida });
    pvpRoom = roomResult.data;
  }

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
                <p>Encerre de uma vez filas e combates pendentes de Arena, PvP e Dungeon.</p>
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
            <div className="arena-mode-grid">
              <Link className="arena-mode-card is-training" href="/arena?modo=training">
                <span className="arena-mode-card__sigil">修</span>
                <i>01</i>
                <small>Sem recompensas</small>
                <strong>Treino</strong>
                <p>Teste habilidades e sequências contra o Boneco Rúnico.</p>
                <b>Entrar →</b>
              </Link>
              {pveStatus?.remaining === 0 ? (
                <article className="arena-mode-locked">
                  <span>獣</span>
                  <small>Limite diário atingido</small>
                  <strong>PvE</strong>
                  <p>Este personagem já realizou as {pveStatus.limit} expedições de hoje.</p>
                  <b>Volte amanhã</b>
                </article>
              ) : (
                <Link className="arena-mode-card is-pve" href="/arena?modo=pve">
                  <span className="arena-mode-card__sigil">獣</span>
                  <i>02</i>
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
                </Link>
              )}
              <Link className="arena-mode-card is-pvp" href="/arena?modo=pvp">
                <span className="arena-mode-card__sigil">対</span>
                <i>03</i>
                <small>Estrutura competitiva</small>
                <strong>PvP</strong>
                <p>Entre na fila para duelos balanceados entre aventureiros.</p>
                <b>Ver fila →</b>
              </Link>
              {isAdministrativeRole(account.role) ? (
                <Link className="arena-mode-card is-dungeon" href="/arena/dungeons">
                  <span className="arena-mode-card__sigil">門</span>
                  <i>04</i>
                  <small>Prévia administrativa · Rank E</small>
                  <strong>Dungeon</strong>
                  <p>Forme um grupo de quatro aventureiros e explore as Ruínas de Verdantia.</p>
                  <b>Abrir expedição →</b>
                </Link>
              ) : null}
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
        {mode === "pvp" && pvpMatchError ? (
          <section className="arena-load-error" role="alert">
            <span>!</span>
            <div>
              <strong>Partida PvP indisponível</strong>
              <p>{pvpMatchError}</p>
            </div>
            <Link href="/arena?modo=pvp">Voltar para a fila</Link>
          </section>
        ) : null}
        {mode === "pvp" && activeCharacter && !query.partida && !opponent ? (
          <PvpLobby
            characterId={activeCharacter.id}
            characterName={activeCharacter.name}
            rank={activeCharacter.adventure_rank}
          />
        ) : null}
        {mode && !(mode === "pve" && arenaSessionError) && (mode !== "pvp" || opponent) ? (
          <>
            <Link className="arena-mode-back" href="/arena">
              ← Trocar modo
            </Link>
            {mode === "pvp" && query.partida && arenaCharacter && arenaOpponent && pvpRoom ? (
              <PvpBattle
                matchId={query.partida}
                initialRoom={pvpRoom}
                character={arenaCharacter}
                opponent={arenaOpponent}
              />
            ) : (
              <TrainingArena
                characters={characters
                  .filter((character) => character.id === characterId)
                  .map(toArenaCharacter)}
                initialCharacterId={query.personagem}
                mode={mode}
                monsterIndex={
                  typeof arenaSessionId === "string"
                    ? Number.parseInt(arenaSessionId.replaceAll("-", "").slice(-4), 16) % 10
                    : 0
                }
                sessionId={typeof arenaSessionId === "string" ? arenaSessionId : undefined}
                opponent={arenaOpponent ?? undefined}
                rules={defaultCombatRules}
              />
            )}
          </>
        ) : null}
      </div>
    </main>
  );
}
