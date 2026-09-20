"use client";

import { CharacterPortraitCard } from "@/components/characters/character-portrait-card";
import type { EquippedTitleData } from "@/components/characters/equipped-title";
import type { CharacterCosmeticLoadout } from "@/lib/content/character-cosmetics";
import styles from "./tactical-combat-identity.module.css";

type CharacterVisual = {
  id: string;
  name: string;
  imageUrl: string | null;
  rank: string;
  level: number;
  title: EquippedTitleData | null;
  cosmetics: CharacterCosmeticLoadout | undefined;
};

type CreatureVisual = {
  id: string;
  name: string;
  rank: string;
  imageUrl: string | null;
};

export function TacticalCombatIdentity({
  characters,
  creatures,
}: {
  characters: CharacterVisual[];
  creatures: CreatureVisual[];
}) {
  const character = characters[0];
  const creature = creatures[0];

  if (!character || !creature) return null;

  return (
    <section className={styles.identity} aria-label="Identidade dos combatentes">
      <div className={styles.playerCard}>
        <CharacterPortraitCard
          imageUrl={character.imageUrl}
          level={character.level}
          name={character.name}
          rank={character.rank}
          title={character.title}
          cosmetics={character.cosmetics}
          variant="compact"
        />
        <div className={styles.caption}>
          <small>Aventureiro selecionado</small>
          <strong>{character.name}</strong>
        </div>
      </div>

      <div className={styles.versus} aria-hidden="true">
        <span>VS</span>
      </div>

      <div className={styles.creatureCard}>
        <div
          className={styles.creaturePortrait}
          role="img"
          aria-label={`Retrato de ${creature.name}`}
          style={creature.imageUrl ? { backgroundImage: `url(${creature.imageUrl})` } : undefined}
        >
          {creature.imageUrl ? null : <span>{creature.name.slice(0, 2).toUpperCase()}</span>}
        </div>
        <div className={styles.creatureMeta}>
          <small>Bestiário · Rank {creature.rank}</small>
          <strong>{creature.name}</strong>
        </div>
      </div>
    </section>
  );
}
