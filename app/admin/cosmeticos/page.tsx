import Link from "next/link";

import { CharacterPortraitCard } from "@/components/characters/character-portrait-card";
import { requireAdministrativeAccount } from "@/lib/auth/account";
import { getActiveCharacterId } from "@/lib/content/active-character";
import {
  cosmeticSlotLabels,
  emptyCharacterCosmetics,
  festivalDasAlmas2026,
  type CharacterCosmeticLoadout,
} from "@/lib/content/character-cosmetics";
import { getCharacterSheet } from "@/lib/content/characters";
import {
  clearCharacterCosmeticsAction,
  equipCosmeticAction,
  equipFestivalSetAction,
} from "./actions";
import styles from "./cosmetics.module.css";

export const metadata = { title: "Loja de Cosméticos | Painel ADM" };
export const dynamic = "force-dynamic";

const notices: Record<string, string> = {
  salvo: "✓ Cosmético equipado no personagem ativo.",
  erro: "! Não foi possível atualizar os cosméticos.",
  "sem-personagem": "! Selecione um personagem antes de testar a coleção.",
};

export default async function AdminCosmeticsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const [account, query] = await Promise.all([requireAdministrativeAccount(), searchParams]);
  const activeId = await getActiveCharacterId(account.id);
  const character = activeId ? await getCharacterSheet(activeId) : null;
  const equippedTitle = character?.inventory.find((item) => item.equippedSlot === "title") ?? null;

  return (
    <div className={`admin-content ${styles.page}`}>
      <header className={styles.hero}>
        <div>
          <span className="eyebrow">Prévia administrativa · acesso restrito</span>
          <h2>Loja de Cosméticos</h2>
          <p>
            Primeira coleção oficial de cosméticos de personagem. Durante esta fase somente
            Administradores e Fundadores conseguem abrir esta página.
          </p>
        </div>
        <div className={styles.collectionMark}>
          <span>☾</span>
          <small>Coleção inaugural</small>
          <strong>Festival das Almas 2026</strong>
        </div>
      </header>

      {query.status && notices[query.status] ? (
        <div className={`account-notice ${query.status === "salvo" ? "" : "is-warning"}`}>
          {notices[query.status]}
        </div>
      ) : null}

      <section className={styles.collectionIntro}>
        <div>
          <span className="eyebrow">Halloween · edição 2026</span>
          <h3>Festival das Almas</h3>
          <p>
            Cinco peças independentes que podem ser misturadas. Equipadas juntas, transformam
            completamente a identidade visual da ficha sem alterar nenhum atributo ou combate.
          </p>
        </div>
        <dl>
          <div><dt>Peças</dt><dd>5</dd></div>
          <div><dt>Tipo</dt><dd>Evento</dd></div>
          <div><dt>Gameplay</dt><dd>0 bônus</dd></div>
        </dl>
      </section>

      {character ? (
        <section className={styles.activeCharacter}>
          <div>
            <small>Personagem de teste</small>
            <strong>{character.name}</strong>
            <span>Nível {character.level} · Rank {character.adventure_rank}</span>
          </div>
          <div className={styles.setActions}>
            <form action={equipFestivalSetAction}>
              <button className="button button--primary" type="submit">Equipar coleção completa</button>
            </form>
            <form action={clearCharacterCosmeticsAction}>
              <button className="button button--dark" type="submit">Remover cosméticos</button>
            </form>
            <Link className="button button--secondary" href={`/personagens/${character.id}`}>Abrir ficha</Link>
          </div>
        </section>
      ) : (
        <section className={styles.noCharacter}>
          <h3>Nenhum personagem ativo</h3>
          <p>Escolha uma ficha para poder testar e equipar os cosméticos.</p>
          <Link className="button button--primary" href="/personagens?selecionar=1">Escolher personagem</Link>
        </section>
      )}

      <section className={styles.grid}>
        {festivalDasAlmas2026.map((item) => {
          const current = character?.cosmetics ?? null;
          const preview: CharacterCosmeticLoadout = {
            ...(current ?? emptyCharacterCosmetics),
            [item.slot]: item.key,
          };
          const equipped = current?.[item.slot] === item.key;

          return (
            <article className={`${styles.item} ${equipped ? styles.isEquipped : ""}`} key={item.key}>
              <div
                className={styles.preview}
                data-preview-background={preview.background ?? undefined}
                data-preview-theme={preview.theme ?? undefined}
              >
                {character ? (
                  <CharacterPortraitCard
                    imageUrl={character.image_url}
                    level={character.level}
                    name={character.name}
                    rank={character.adventure_rank}
                    title={equippedTitle}
                    cosmetics={preview}
                    variant="standard"
                  />
                ) : (
                  <div className={styles.placeholder}><span>{item.icon}</span><b>Prévia</b></div>
                )}
              </div>
              <div className={styles.itemBody}>
                <div className={styles.itemMeta}>
                  <span>{cosmeticSlotLabels[item.slot]}</span>
                  <b>{equipped ? "Equipado" : "Evento 2026"}</b>
                </div>
                <h3>{item.name}</h3>
                <p>{item.description}</p>
                <footer>
                  <span>Festival das Almas 2026</span>
                  {character ? (
                    <form action={equipCosmeticAction}>
                      <input name="slot" type="hidden" value={item.slot} />
                      <input name="key" type="hidden" value={item.key} />
                      <button className="button button--primary" disabled={equipped} type="submit">
                        {equipped ? "Equipado" : "Equipar"}
                      </button>
                    </form>
                  ) : null}
                </footer>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
