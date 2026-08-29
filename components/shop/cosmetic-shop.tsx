import Link from "next/link";

import { CharacterPortraitCard } from "@/components/characters/character-portrait-card";
import {
  cosmeticSlotLabels,
  emptyCharacterCosmetics,
  festivalDasAlmas2026,
  type CharacterCosmeticLoadout,
  type CharacterCosmeticSlot,
} from "@/lib/content/character-cosmetics";
import type { CharacterSheet } from "@/lib/content/characters";
import {
  clearCharacterCosmeticsAction,
  equipCosmeticAction,
  equipFestivalSetAction,
} from "@/app/loja/cosmetic-actions";

const notices: Record<string, string> = {
  salvo: "Cosmético atualizado com sucesso.",
  erro: "Não foi possível atualizar os cosméticos.",
  "sem-personagem": "Selecione um personagem antes de testar a coleção.",
};

function PreviewMockup({
  slot,
  active,
}: {
  slot: CharacterCosmeticSlot;
  active: boolean;
}) {
  return (
    <div className="cosmetic-sheet-mockup" data-active={active ? "true" : "false"} data-slot={slot}>
      <div className="cosmetic-sheet-mockup__moon" />
      <div className="cosmetic-sheet-mockup__castle" />
      <div className="cosmetic-sheet-mockup__pumpkins"><i /><i /><i /></div>
      <div className="cosmetic-sheet-mockup__candles"><i /><i /><i /></div>
      <div className="cosmetic-sheet-mockup__top">
        <span />
        <span />
      </div>
      <div className="cosmetic-sheet-mockup__body">
        <aside>
          <i />
          <i />
          <i />
        </aside>
        <section>
          <b />
          <b />
          <b />
          <b />
        </section>
      </div>
      <div className="cosmetic-sheet-mockup__mist" />
    </div>
  );
}

export function CosmeticShop({
  character,
  status,
}: {
  character: CharacterSheet;
  status?: string;
}) {
  const equippedTitle = character.inventory.find((item) => item.equippedSlot === "title") ?? null;

  return (
    <section className="cosmetic-shop">
      {status && notices[status] ? (
        <div
          className={`shop-purchase-notice ${status === "salvo" ? "is-success" : "is-error"}`}
          role="status"
        >
          <span>{status === "salvo" ? "✓" : "!"}</span>
          <div>
            <strong>{notices[status]}</strong>
            <small>
              {status === "salvo"
                ? "A alteração já foi aplicada à ficha do personagem."
                : "Nenhuma alteração foi aplicada."}
            </small>
          </div>
        </div>
      ) : null}

      <section className="cosmetic-collection-banner">
        <div>
          <span className="eyebrow">Coleção inaugural · Halloween 2026</span>
          <h2>Festival das Almas</h2>
          <p>
            Uma coleção pensada para parecer rara de verdade: luz espectral, lua sangrenta,
            névoa viva e uma ficha totalmente transformada. Cada peça continua sendo 100% visual.
          </p>
        </div>
        <div className="cosmetic-collection-actions">
          <form action={equipFestivalSetAction}>
            <button className="button button--primary" type="submit">
              Equipar coleção completa
            </button>
          </form>
          <form action={clearCharacterCosmeticsAction}>
            <button className="button button--dark" type="submit">
              Remover cosméticos
            </button>
          </form>
          <Link className="button button--secondary" href={`/personagens/${character.id}`}>
            Abrir ficha
          </Link>
        </div>
      </section>

      <div className="cosmetic-grid">
        {festivalDasAlmas2026.map((item) => {
          const preview: CharacterCosmeticLoadout = {
            ...emptyCharacterCosmetics,
            [item.slot]: item.key,
          };
          const equipped = character.cosmetics[item.slot] === item.key;
          const usesPortrait = item.slot === "card" || item.slot === "frame" || item.slot === "aura";

          return (
            <article className={`cosmetic-item ${equipped ? "is-equipped" : ""}`} key={item.key}>
              <header>
                <div>
                  <small>{cosmeticSlotLabels[item.slot]}</small>
                  <h3>{item.name}</h3>
                </div>
                <span>{equipped ? "Equipado" : "Evento 2026"}</span>
              </header>

              <div className="cosmetic-comparison">
                <div className="cosmetic-comparison__panel">
                  <b>Padrão</b>
                  <div className="cosmetic-comparison__visual">
                    {usesPortrait ? (
                      <CharacterPortraitCard
                        imageUrl={character.image_url}
                        level={character.level}
                        name={character.name}
                        rank={character.adventure_rank}
                        title={equippedTitle}
                        variant="standard"
                      />
                    ) : (
                      <PreviewMockup active={false} slot={item.slot} />
                    )}
                  </div>
                </div>

                <div className="cosmetic-comparison__arrow" aria-hidden="true">→</div>

                <div className="cosmetic-comparison__panel is-after">
                  <b>Com cosmético</b>
                  <div className="cosmetic-comparison__visual">
                    {usesPortrait ? (
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
                      <PreviewMockup active slot={item.slot} />
                    )}
                  </div>
                </div>
              </div>

              <div className="cosmetic-item__body">
                <p>{item.description}</p>
                <div className="cosmetic-effect-note">
                  <span>O que muda</span>
                  <strong>
                    {item.slot === "card"
                      ? "Lua sangrenta, sombras violetas, brilho de borda e atmosfera sobrenatural no card."
                      : item.slot === "frame"
                        ? "Moldura artística sobreposta ao card, com ornamentos e brilho próprio."
                        : item.slot === "background"
                          ? "Cemitério, castelo, lua sangrenta, névoa e elementos de Halloween atrás da ficha."
                          : item.slot === "aura"
                            ? "Almas maiores, rastros luminosos e névoa animada circulando o retrato."
                            : "Toda a ficha vira uma interface de Halloween: painéis, abas, destaques, textos e iluminação."}
                  </strong>
                </div>
              </div>

              <footer>
                <span>Festival das Almas 2026</span>
                <form action={equipCosmeticAction}>
                  <input name="slot" type="hidden" value={item.slot} />
                  <input name="key" type="hidden" value={item.key} />
                  <button className="button button--primary" disabled={equipped} type="submit">
                    {equipped ? "Equipado" : "Equipar"}
                  </button>
                </form>
              </footer>
            </article>
          );
        })}
      </div>
    </section>
  );
}
