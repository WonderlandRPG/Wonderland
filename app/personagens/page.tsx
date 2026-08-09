import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";
import { DeleteCharacterButton } from "@/components/characters/delete-character-button";
import { requireCurrentAccount } from "@/lib/auth/account";
import { getCharacterRules } from "@/lib/content/character-settings";
import { getCharacterSheets } from "@/lib/content/characters";
import { getActiveCharacterId } from "@/lib/content/active-character";
import { selectCharacterAction } from "./select-actions";

export const metadata = { title: "Meus Personagens" };
export const dynamic = "force-dynamic";

const noticeMessages: Record<string, string> = {
  criado: "Personagem criado! Agora escolha com quem deseja jogar.",
  excluido: "O personagem foi excluído.",
  erro: "Não foi possível concluir a operação.",
};

export default async function CharactersPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; selecionar?: string; next?: string }>;
}) {
  const account = await requireCurrentAccount("/personagens");
  const [characters, rules, query, activeCharacterId] = await Promise.all([
    getCharacterSheets(account.id),
    getCharacterRules(),
    searchParams,
    getActiveCharacterId(account.id),
  ]);
  return (
    <main className="character-page">
      <header className="account-header">
        <BrandMark inverse />
        <nav>
          <Link href="/">Portal</Link>
          <Link href="/perfil">Minha conta</Link>
        </nav>
      </header>
      <div className="page-container character-page__inner">
        <header className="character-page__header">
          <div>
            <span className="eyebrow">Companhia de {account.displayName}</span>
            <h1>Meus personagens</h1>
            <p>Até três fichas persistentes, sempre ligadas às regras publicadas no Painel ADM.</p>
          </div>
          {characters.length < rules.maximumSlots ? (
            <Link className="button button--primary" href="/personagens/novo">
              Criar personagem ＋
            </Link>
          ) : (
            <span>
              {characters.length} / {rules.maximumSlots} fichas
            </span>
          )}
        </header>
        {query.notice && noticeMessages[query.notice] ? (
          <div
            className={`account-notice ${query.notice === "erro" ? "is-warning" : ""}`}
            data-sfx-on-mount={query.notice === "erro" ? "error" : "confirm"}
            role="status"
          >
            <span>{query.notice === "erro" ? "!" : "✓"}</span>
            {noticeMessages[query.notice]}
          </div>
        ) : null}
        {query.selecionar === "1" ? (
          <div className="account-notice" role="status">
            <span>♜</span>Escolha o personagem com quem deseja jogar nesta sessão.
          </div>
        ) : null}
        {characters.length > 0 ? (
          <section className="character-card-grid">
            {characters.map((character) => (
              <article className="character-card" key={character.id}>
                <div className="character-card__portrait">
                  <span>{character.name.slice(0, 2).toUpperCase()}</span>
                  <small>Nível {character.level}</small>
                </div>
                <div className="character-card__body">
                  <span className="eyebrow">
                    {character.race.name} · {character.characterClass.name}
                  </span>
                  <h2>{character.name}</h2>
                  {character.id === activeCharacterId ? <small>Personagem em jogo</small> : null}
                  <p>{character.characterClass.payload.specialization}</p>
                  <p>{character.gold.toLocaleString("pt-BR")} WG</p>
                  <div>
                    <span>
                      HP <strong>{character.stats.maxHp}</strong>
                    </span>
                    <span>
                      Mana <strong>{character.stats.maxMana}</strong>
                    </span>
                    <span>
                      INI <strong>{character.stats.initiative}</strong>
                    </span>
                  </div>
                </div>
                <footer>
                  <form action={selectCharacterAction}>
                    <input name="characterId" type="hidden" value={character.id} />
                    <input name="next" type="hidden" value={query.next ?? "/perfil"} />
                    <button className="button button--dark" type="submit">
                      {character.id === activeCharacterId ? "Continuar jogando" : "Jogar com este"}
                    </button>
                  </form>
                  <Link className="button button--primary" href={`/personagens/${character.id}`}>
                    Abrir ficha
                  </Link>
                  <DeleteCharacterButton id={character.id} name={character.name} />
                </footer>
              </article>
            ))}
          </section>
        ) : (
          <section className="character-empty">
            <span>00/03</span>
            <h2>Sua primeira ficha começa aqui</h2>
            <p>Escolha raça, classe e distribua 100 pontos para entrar no Wonderland.</p>
            <Link className="button button--primary" href="/personagens/novo">
              Criar primeiro personagem
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}
