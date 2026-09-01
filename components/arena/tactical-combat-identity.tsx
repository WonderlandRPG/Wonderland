"use client";

import { useEffect, useMemo, useState } from "react";

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

function cssImage(url: string | null) {
  if (!url) return "none";
  return `url("${url.replace(/"/g, "\\\"")}")`;
}

export function TacticalCombatIdentity({
  characters,
  creatures,
}: {
  characters: CharacterVisual[];
  creatures: CreatureVisual[];
}) {
  const [characterId, setCharacterId] = useState(characters[0]?.id ?? "");
  const [creatureId, setCreatureId] = useState(creatures[0]?.id ?? "");

  const character = useMemo(
    () => characters.find((entry) => entry.id === characterId) ?? characters[0],
    [characterId, characters],
  );
  const creature = useMemo(
    () => creatures.find((entry) => entry.id === creatureId) ?? creatures[0],
    [creatureId, creatures],
  );

  useEffect(() => {
    const stage = document.querySelector<HTMLElement>(".tactical-lab-stage");
    const lab = stage?.querySelector<HTMLElement>('[aria-label="Laboratório do mapa tático V8"]');
    if (!stage || !lab) return;

    const selects = Array.from(lab.querySelectorAll<HTMLSelectElement>("select"));
    const characterSelect = selects[0];
    const creatureSelect = selects[1];
    if (!characterSelect || !creatureSelect) return;

    const sync = () => {
      setCharacterId(characterSelect.value);
      setCreatureId(creatureSelect.value);
    };

    sync();
    characterSelect.addEventListener("change", sync);
    creatureSelect.addEventListener("change", sync);
    return () => {
      characterSelect.removeEventListener("change", sync);
      creatureSelect.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    const stage = document.querySelector<HTMLElement>(".tactical-lab-stage");
    if (!stage) return;
    stage.style.setProperty("--tactical-player-image", cssImage(character?.imageUrl ?? null));
    stage.style.setProperty("--tactical-creature-image", cssImage(creature?.imageUrl ?? null));
  }, [character, creature]);

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
