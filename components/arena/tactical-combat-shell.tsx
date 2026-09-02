"use client";

import { useState, type ComponentProps } from "react";

import { TacticalActionCategories } from "@/components/arena/tactical-action-categories";
import { TacticalCombatIdentity } from "@/components/arena/tactical-combat-identity";
import { TacticalLabV9 } from "@/components/arena/tactical-lab-v9";
import styles from "./tactical-combat-shell.module.css";

type LabProps = ComponentProps<typeof TacticalLabV9>;
type IdentityProps = ComponentProps<typeof TacticalCombatIdentity>;
type Character = LabProps["characters"][number] & IdentityProps["characters"][number];
type Creature = LabProps["creatures"][number] & IdentityProps["creatures"][number];
type TacticalScene = "forest" | "ruins" | "veil" | "moon" | "ember";

const TACTICAL_SCENES: Array<{
  key: TacticalScene;
  name: string;
  description: string;
  mood: string;
}> = [
  {
    key: "forest",
    name: "Bosque Místico",
    description: "Clareira ancestral tomada por raízes, musgo e energia feérica.",
    mood: "Floresta ancestral",
  },
  {
    key: "ruins",
    name: "Ruínas de Verdantia",
    description: "Pátio de pedra coberto por vegetação e restos de uma civilização esquecida.",
    mood: "Ruínas selvagens",
  },
  {
    key: "veil",
    name: "Véu Sombrio",
    description: "Clareira noturna marcada por névoa, pedra negra e brilho espectral.",
    mood: "Noite espectral",
  },
  {
    key: "moon",
    name: "Santuário Lunar",
    description: "Bosque antigo banhado por luar frio, cristais azulados e silêncio arcano.",
    mood: "Luar arcano",
  },
  {
    key: "ember",
    name: "Ruínas do Crepúsculo",
    description: "Pedras antigas sob luz âmbar, poeira quente e ecos de uma batalha esquecida.",
    mood: "Crepúsculo antigo",
  },
];

export function TacticalCombatShell({
  characters,
  creatures,
}: {
  characters: Character[];
  creatures: Creature[];
}) {
  const [started, setStarted] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [scene, setScene] = useState<TacticalScene>("forest");
  const selectedScene = TACTICAL_SCENES.find((entry) => entry.key === scene) ?? TACTICAL_SCENES[0];

  return (
    <div
      className={styles.shell}
      data-combat-mode={started ? "battle" : "preparation"}
      data-details-open={detailsOpen ? "true" : "false"}
      data-map-scene={scene}
    >
      {!started ? (
        <section className={styles.preparationHeader}>
          <div className={styles.preparationIntro}>
            <span className={styles.eyebrow}>Combate tático</span>
            <h1>Prepare a arena</h1>
            <p>
              Escolha o aventureiro, o inimigo e um dos cinco campos de batalha. O cenário muda a
              ambientação visual sem alterar as regras do combate.
            </p>
          </div>

          <div className={styles.scenePicker} role="radiogroup" aria-label="Escolha o cenário do combate">
            {TACTICAL_SCENES.map((entry) => (
              <button
                key={entry.key}
                type="button"
                role="radio"
                aria-checked={scene === entry.key}
                className={styles.sceneCard}
                data-scene={entry.key}
                data-selected={scene === entry.key ? "true" : "false"}
                onClick={() => setScene(entry.key)}
              >
                <span className={styles.scenePreview} aria-hidden="true" />
                <span className={styles.sceneCopy}>
                  <small>{entry.mood}</small>
                  <strong>{entry.name}</strong>
                  <span>{entry.description}</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <div className={styles.battleTopbar}>
          <button type="button" onClick={() => setStarted(false)}>
            <span aria-hidden="true">←</span>
            Preparação
          </button>
          <div className={styles.battleSceneTitle}>
            <small>Campo de batalha</small>
            <strong>{selectedScene.name}</strong>
          </div>
          <button type="button" onClick={() => setDetailsOpen((value) => !value)}>
            {detailsOpen ? "Fechar painel" : "Log / detalhes"}
          </button>
        </div>
      )}

      <div className={styles.identityWrap}>
        <TacticalCombatIdentity characters={characters} creatures={creatures} />
      </div>

      <div className={styles.labWrap}>
        <TacticalLabV9 characters={characters} creatures={creatures} />
      </div>

      <TacticalActionCategories active={started} />

      {!started ? (
        <div className={styles.startArea}>
          <button className={styles.startButton} type="button" onClick={() => setStarted(true)}>
            <span>Entrar no campo</span>
            <strong>Iniciar combate</strong>
          </button>
        </div>
      ) : null}
    </div>
  );
}
