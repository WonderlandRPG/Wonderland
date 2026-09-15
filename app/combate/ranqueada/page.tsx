import Image from "next/image";
import Link from "next/link";

import { PlayerNav } from "@/components/player-nav";
import { PvpLobby } from "@/components/arena/pvp-lobby";
import { requireActiveCharacter } from "@/lib/content/active-character";
import { getCharacterSheets } from "@/lib/content/characters";
import { competitiveRanks } from "@/lib/game/competitive-ranks";

export const metadata = { title: "Ranqueada" };
export const dynamic = "force-dynamic";

export default async function RankedPage() {
  const { account, characterId } = await requireActiveCharacter("/combate/ranqueada");
  const characters = await getCharacterSheets(account.id);
  const character = characters.find((entry) => entry.id === characterId);
  if (!character) return null;

  return (
    <main className="arena-page">
      <PlayerNav />
      <div className="page-container arena-page__inner">
        <Link className="arena-mode-back" href="/combate">
          ← Voltar aos modos
        </Link>
        <section className="arena-mode-select">
          <header>
            <span className="eyebrow">Temporada competitiva</span>
            <h1>Ranqueada 2 × 2</h1>
            <p>
              As cinco primeiras partidas definem o elo inicial. Depois delas, vitórias e derrotas
              alteram seu PdL.
            </p>
          </header>
          <div className="ranked-emblem-grid">
            {competitiveRanks.map((rank) => (
              <article key={rank.key}>
                <Image alt={`Brasão ${rank.name}`} height={128} src={rank.image} width={128} />
                <strong>{rank.name}</strong>
                <small>{rank.divisions}</small>
              </article>
            ))}
          </div>
        </section>
        <PvpLobby
          characterId={character.id}
          characterName={character.name}
          rank={character.adventure_rank}
          ranked
        />
      </div>
    </main>
  );
}
