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

  return (
    <main className={styles.page}>
      <PlayerNav />
      <div className={styles.inner}>
        <header className={styles.intro}>
          <div>
            <small>{selecting ? `Salão de ${account.displayName}` : "Aventureiro em jornada"}</small>
            <h1>{selecting ? "Escolha seu aventureiro" : `Bem-vindo, ${activeCharacter?.name}`}</h1>
            <p>{selecting ? "Cada ficha representa uma história diferente. Escolha quem atravessará os portões de Wonderland." : "Seu personagem está em campo. Continue a jornada a partir daqui."}</p>
          </div>
          {!selecting ? <div className={styles.online}>Online em Wonderland</div> : characters.length < rules.maximumSlots ? <Link className="button button--primary" href="/personagens/novo">Criar personagem ＋</Link> : <span>{characters.length} / {rules.maximumSlots} fichas</span>}
        </header>

        {query.notice && noticeMessages[query.notice] ? <div className={styles.notice} role="status">{noticeMessages[query.notice]}</div> : null}

        {characters.length > 0 ? (
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

            {!selecting && activeCharacter ? (
              <aside className={styles.session}>
                <small>Registro da jornada</small><h2>{activeCharacter.name} está em campo</h2>
                <p>Todas as ações de combate, comércio, inventário e presença serão realizadas por este aventureiro até que você troque de personagem.</p>
                <dl><div><dt>Personagem</dt><dd>{activeCharacter.name}</dd></div><div><dt>Raça</dt><dd>{activeCharacter.race.name}</dd></div><div><dt>Classe</dt><dd>{activeCharacter.characterClass.name}</dd></div><div><dt>Nível</dt><dd>{activeCharacter.level}</dd></div></dl>
                <Link className="button button--secondary" href="/personagens?selecionar=1">Trocar aventureiro</Link>
              </aside>
            ) : null}
          </section>
        ) : (
          <section className={styles.empty}><h2>Sua primeira lenda começa aqui</h2><p>Escolha raça, classe e distribua seus pontos para atravessar os portões de Wonderland.</p><Link className="button button--primary" href="/personagens/novo">Criar primeiro personagem</Link></section>
        )}

        {!selecting && activeCharacter ? (
          <section className={styles.commands}>
            <header><small>Escolha o próximo destino</small><h2>Para onde a jornada segue?</h2></header>
            <div className={styles.signs}>
              <Link className={styles.sign} href="/arena"><span>⚔</span><small>Combate</small><strong>Arena</strong></Link>
              <Link className={styles.sign} href={`/personagens/${activeCharacter.id}?tab=equipamentos`}><span>◈</span><small>Preparação</small><strong>Equipamentos</strong></Link>
              <Link className={styles.sign} href="/loja"><span>◆</span><small>Comércio</small><strong>Mercado</strong></Link>
              <div className={`${styles.sign} ${styles.disabled}`}><span>⌖</span><small>Exploração</small><strong>Mapa em manutenção</strong></div>
              <Link className={styles.sign} href="/eventos"><span>◇</span><small>Agenda</small><strong>Eventos</strong></Link>
              <Link className={styles.sign} href="/ranking"><span>♜</span><small>Prestígio</small><strong>Ranking</strong></Link>
            </div>
          </section>
        ) : null}

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
