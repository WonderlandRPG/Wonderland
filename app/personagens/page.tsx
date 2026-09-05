import Link from "next/link";

import { PlayerNav } from "@/components/player-nav";
import { CharacterPortraitCard } from "@/components/characters/character-portrait-card";
import { DeleteCharacterButton } from "@/components/characters/delete-character-button";
import { requireCurrentAccount } from "@/lib/auth/account";
import { getCharacterRules } from "@/lib/content/character-settings";
import { getCharacterSheets } from "@/lib/content/characters";
import { getActiveCharacterId } from "@/lib/content/active-character";
import { getAdventureRank } from "@/lib/game/ranks";
import { getRecentPortalUpdates } from "@/lib/game/player-portal";
import { getLevelProgress } from "@/lib/game/experience";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { parseMissionBoard } from "@/lib/game/missions";
import { selectCharacterAction } from "./select-actions";
import styles from "./personagens.module.css";

export const metadata = { title: "Meus Personagens" };
export const dynamic = "force-dynamic";

const noticeMessages: Record<string, string> = {
  criado: "Personagem criado! Agora escolha com quem deseja jogar.",
  excluido: "O personagem foi excluído.",
  erro: "Não foi possível concluir a operação.",
};

export default async function CharactersPage({ searchParams }: { searchParams: Promise<{ notice?: string; selecionar?: string; next?: string }> }) {
  const account = await requireCurrentAccount("/personagens");
  const [characters, rules, query, activeCharacterId, recentUpdates] = await Promise.all([
    getCharacterSheets(account.id), getCharacterRules(), searchParams, getActiveCharacterId(account.id), getRecentPortalUpdates(3),
  ]);
  const selecting = query.selecionar === "1" || !activeCharacterId;
  const activeCharacter = characters.find((character) => character.id === activeCharacterId);
  const visibleCharacters = selecting ? characters : activeCharacter ? [activeCharacter] : characters;
  const activeProgress = activeCharacter ? getLevelProgress(activeCharacter.xp) : null;
  const activeRank = activeCharacter ? getAdventureRank(activeCharacter.adventure_rank) : null;
  const client = await createServerSupabaseClient();
  const journeyResult = activeCharacter && client ? await Promise.all([
    client.rpc("v2_get_mission_board", { p_character_id: activeCharacter.id }),
    client.rpc("v2_get_pve_daily_status", { p_character_id: activeCharacter.id }),
  ]) : null;
  const journeyBoard = journeyResult ? parseMissionBoard(journeyResult[0].data) : null;
  const pveRaw = journeyResult?.[1].data;
  const pve = pveRaw && typeof pveRaw === "object" && !Array.isArray(pveRaw) ? pveRaw as Record<string, unknown> : null;
  const equippedCount = activeCharacter?.inventory.filter((item) => item.equippedSlot).length ?? 0;
  const abilityCount = activeCharacter
    ? activeCharacter.unlockedRaceAbilities.length + activeCharacter.unlockedClassSkills.length
    : 0;
  const peakPower = activeCharacter
    ? Math.max(activeCharacter.stats.physicalPower, activeCharacter.stats.magicalPower, activeCharacter.stats.supportPower)
    : 0;
  const nextClassSkill = activeCharacter?.characterClass.payload.progression
    .filter((skill) => skill.level > activeCharacter.level)
    .sort((left, right) => left.level - right.level)[0];
  const pathUnlock = activeCharacter && !activeCharacter.class_path_key
    ? activeCharacter.characterClass.payload.paths.slice().sort((left, right) => left.unlockLevel - right.unlockLevel)[0]
    : null;

  return (
    <main className={styles.page}>
      <PlayerNav />
      <div className={styles.inner}>
        <header className={`${styles.intro} ${!selecting ? styles.commandHeader : ""}`}>
          <div>
            <small>{selecting ? `Salão de ${account.displayName}` : "Central do aventureiro"}</small>
            <h1>{selecting ? "Escolha seu aventureiro" : "Comando de jornada"}</h1>
            <p>{selecting ? "Cada ficha representa uma história diferente. Escolha quem atravessará os portões de Wonderland." : `Tudo que ${activeCharacter?.name} precisa para continuar a aventura, em uma única tela.`}</p>
          </div>
          {!selecting ? <div className={styles.headerActions}><span className={styles.online}>● Online</span><Link href="/personagens?selecionar=1">Trocar aventureiro</Link></div> : characters.length < rules.maximumSlots ? <Link className="button button--primary" href="/personagens/novo">Criar personagem ＋</Link> : <span>{characters.length} / {rules.maximumSlots} fichas</span>}
        </header>

        {query.notice && noticeMessages[query.notice] ? <div className={styles.notice} role="status">{noticeMessages[query.notice]}</div> : null}

        {!selecting && activeCharacter && activeProgress && activeRank ? (
          <section className={styles.activeDashboard} style={{ "--card-rank": activeRank.color } as React.CSSProperties}>
            <div className={`${styles.activePortrait} official-character-card-host`}>
              <CharacterPortraitCard
                imageUrl={activeCharacter.image_url}
                level={activeCharacter.level}
                name={activeCharacter.name}
                rank={activeCharacter.adventure_rank}
                title={activeCharacter.inventory.find((item) => item.equippedSlot === "title") ?? null}
                cosmetics={activeCharacter.cosmetics}
                variant="standard"
              />
            </div>
            <div className={styles.activeSummary}>
              <header>
                <div><small>Em jornada por Wonderland</small><h2>{activeCharacter.name}</h2><p>{activeCharacter.race.name} · {activeCharacter.characterClass.name} · Rank {activeRank.key}</p></div>
                <strong className={styles.levelBadge}><small>Nível</small>{activeCharacter.level}</strong>
              </header>
              <div className={styles.progress}>
                <div><span>Próximo nível</span><strong>{activeProgress.percent}%</strong></div>
                <i><b style={{ width: `${activeProgress.percent}%` }} /></i>
                <small>{activeCharacter.xp.toLocaleString("pt-BR")} XP · faltam {(activeProgress.next - activeCharacter.xp).toLocaleString("pt-BR")}</small>
              </div>
              <dl className={styles.dashboardStats}>
                <div><dt>Vitalidade</dt><dd>{activeCharacter.stats.maxHp}</dd><small>HP máximo</small></div>
                <div><dt>Iniciativa</dt><dd>{activeCharacter.stats.initiative}</dd><small>Ordem de ação</small></div>
                <div><dt>Pico de poder</dt><dd>{peakPower}</dd><small>Potência atual</small></div>
                <div><dt>Carteira</dt><dd>{activeCharacter.gold.toLocaleString("pt-BR")}</dd><small>WG disponível</small></div>
              </dl>
              <div className={styles.readiness}>
                <span><b>{equippedCount}</b> itens equipados</span>
                <span><b>{abilityCount}</b> técnicas liberadas</span>
                <span><b>{activeCharacter.characterClass.payload.resource.name}</b> recurso de classe</span>
                {nextClassSkill ? <span><b>Nível {nextClassSkill.level}</b> libera {nextClassSkill.name}</span> : <span><b>Técnicas</b> progressão completa</span>}
                {pathUnlock ? <span><b>Nível {pathUnlock.unlockLevel}</b> escolha de caminho</span> : null}
              </div>
              <div className={styles.primaryActions}>
                <Link className="button button--primary" href={`/personagens/${activeCharacter.id}`}>Abrir ficha completa</Link>
                <Link className="button button--dark" href="/arena">Entrar na Arena</Link>
              </div>
              <div className={styles.journeyStrip}>
                <div><small>Próximo passo</small><strong>{journeyBoard?.activeAssignment ? journeyBoard.activeAssignment.name : "Escolha uma missão"}</strong><span>{journeyBoard?.activeAssignment ? "Missão em andamento · continue a cena" : "Uma missão libera XP e avanço de rank"}</span></div>
                <div><small>PvE hoje</small><strong>{Number(pve?.used ?? 0)} / {Number(pve?.limit ?? 5)} lutas</strong><span>{Number(pve?.remaining ?? 5) > 0 ? "Recompensas disponíveis" : "Limite diário atingido · reseta à meia-noite"}</span></div>
                <Link href={journeyBoard?.activeAssignment ? "/missoes" : "/missoes"}>Abrir jornada →</Link>
              </div>
              {(activeCharacter.level <= 5 || equippedCount === 0 || !journeyBoard?.activeAssignment) ? <section className={styles.onboarding} aria-label="Primeiros passos">
                <header><small>Primeiros passos</small><strong>Comece sua aventura</strong></header>
                <ol>
                  <li className={styles.done}><span>1</span><div><b>Personagem escolhido</b><small>{activeCharacter.name} está ativo</small></div></li>
                  <li className={equippedCount > 0 ? styles.done : ""}><span>2</span><div><b>Equipe um item</b><small>{equippedCount > 0 ? "Equipamento preparado" : "Abra a ficha e prepare sua build"}</small></div></li>
                  <li className={journeyBoard?.activeAssignment ? styles.done : ""}><span>3</span><div><b>Aceite a missão introdutória</b><small>{journeyBoard?.activeAssignment ? "Contrato em andamento" : "Escolha um contrato no mural"}</small></div></li>
                  <li className={Number(pve?.used ?? 0) > 0 ? styles.done : ""}><span>4</span><div><b>Conclua seu primeiro combate</b><small>O treino não gasta as lutas diárias</small></div></li>
                </ol>
              </section> : null}
            </div>
            <aside className={styles.destinations}>
              <header><small>Acesso rápido</small><h2>Próximo destino</h2></header>
              <nav>
                <Link href={`/personagens/${activeCharacter.id}?tab=equipamentos`}><span>◈</span><b>Equipamentos</b><small>Preparar build</small></Link>
                <Link href="/loja"><span>◆</span><b>Mercado</b><small>Comprar itens</small></Link>
                <Link href="/missoes"><span>✦</span><b>Missões</b><small>Ganhar XP</small></Link>
                <Link href="/presenca"><span>◇</span><b>Presença</b><small>Resgatar prêmio</small></Link>
                <Link href="/eventos"><span>⌁</span><b>Eventos</b><small>Ver agenda</small></Link>
                <Link href="/ranking"><span>♜</span><b>Ranking</b><small>Ver posição</small></Link>
              </nav>
            </aside>
          </section>
        ) : characters.length > 0 ? (
          <section className={`${styles.roster} ${!selecting ? styles.rosterLobby : ""}`}>
            {visibleCharacters.map((character) => {
              const rank = getAdventureRank(character.adventure_rank);
              const equippedTitle = character.inventory.find((item) => item.equippedSlot === "title") ?? null;
              return (
                <article className={styles.heroCard} key={character.id} style={{ "--card-rank": rank.color } as React.CSSProperties}>
                  <CharacterPortraitCard
                    imageUrl={character.image_url}
                    level={character.level}
                    name={character.name}
                    rank={character.adventure_rank}
                    title={equippedTitle}
                    cosmetics={character.cosmetics}
                    variant="standard"
                  />
                  <div className={styles.body}>
                    <small>Herói de Wonderland</small><h2>{character.name}</h2>
                    <dl className={styles.identity}><div><dt>Raça</dt><dd>{character.race.name}</dd></div><div><dt>Classe</dt><dd>{character.characterClass.name}</dd></div><div><dt>Rank</dt><dd>{rank.key}</dd></div></dl>
                    <p className={styles.wallet}><span>Carteira</span><strong>{character.gold.toLocaleString("pt-BR")} WG</strong></p>
                    <div className={styles.stats}><span>HP <strong>{character.stats.maxHp}</strong></span><span>Recurso <strong>{character.characterClass.payload.resource.name}</strong></span><span>INI <strong>{character.stats.initiative}</strong></span></div>
                  </div>
                  <footer className={styles.footer}>
                    {selecting ? <form action={selectCharacterAction}><input name="characterId" type="hidden" value={character.id} /><input name="next" type="hidden" value={query.next ?? "/personagens"} /><button className="button button--dark" type="submit">{character.id === activeCharacterId ? "Continuar jornada" : "Jogar com este"}</button></form> : <Link className="button button--dark" href="/arena">Ir para a Arena</Link>}
                    {selecting ? <form action={selectCharacterAction}><input name="characterId" type="hidden" value={character.id} /><input name="next" type="hidden" value={`/personagens/${character.id}`} /><button className="button button--primary" type="submit">Abrir ficha</button></form> : <Link className="button button--primary" href={`/personagens/${character.id}`}>Abrir ficha</Link>}
                    {selecting ? <DeleteCharacterButton id={character.id} name={character.name} /> : null}
                  </footer>
                </article>
              );
            })}

          </section>
        ) : (
          <section className={styles.empty}><h2>Sua primeira lenda começa aqui</h2><p>Escolha raça, classe e distribua seus pontos para atravessar os portões de Wonderland.</p><Link className="button button--primary" href="/personagens/novo">Criar primeiro personagem</Link></section>
        )}

        {recentUpdates.length > 0 ? (
          <section className={styles.updates}>
            <header><div><small>Crônicas recentes</small><h2>O que mudou em Wonderland</h2></div><Link href="/atualizacoes">Abrir diário completo →</Link></header>
            <div className={styles.updatesGrid}>
              {recentUpdates.map((update) => {
                const summary = update.notes.find((block) => ["paragraph", "highlight", "list"].includes(block.type))?.content;
                return <Link className={styles.update} href="/atualizacoes" key={update.id}><small>Versão {update.version}</small><h3>{update.title}</h3><p>{summary ?? "Abra as crônicas para conhecer os detalhes desta atualização."}</p></Link>;
              })}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
