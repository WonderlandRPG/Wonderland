"use client";

import { useState, type ComponentProps, type CSSProperties } from "react";

import { TacticalCombatIdentity } from "@/components/arena/tactical-combat-identity";
import { TacticalCombatCore } from "@/components/arena/tactical-combat-core";
import { getTacticalMapById } from "@/lib/game/tactical-maps";
import styles from "./tactical-combat-shell.module.css";

type CombatProps = ComponentProps<typeof TacticalCombatCore>;
type IdentityProps = ComponentProps<typeof TacticalCombatIdentity>;
type Character = CombatProps["characters"][number] & IdentityProps["characters"][number];
type Creature = CombatProps["creatures"][number] & IdentityProps["creatures"][number];
type TacticalScene = "forest" | "ruins" | "veil" | "moon" | "ember";

type SceneDefinition = {
  key: TacticalScene;
  name: string;
  description: string;
  mood: string;
  image: string;
  mapId: string;
};

const TACTICAL_SCENES: SceneDefinition[] = [
  {
    key: "forest",
    name: "Bosque Místico",
    description: "Cobertura central e duas rotas laterais para aproximação.",
    mood: "Floresta ancestral",
    image: "/tactical/maps/forest-arena.webp",
    mapId: "ruinas-centrais",
  },
  {
    key: "ruins",
    name: "Ruínas de Verdantia",
    description: "Corredores quebrados favorecem controle e combate frontal.",
    mood: "Ruínas selvagens",
    image: "/tactical/maps/ruins-arena.webp",
    mapId: "corredor-quebrado",
  },
  {
    key: "veil",
    name: "Véu Sombrio",
    description: "Campo aberto com um núcleo de obstáculos e flancos livres.",
    mood: "Noite espectral",
    image: "/tactical/maps/veil-arena.webp",
    mapId: "clareira-partida",
  },
  {
    key: "moon",
    name: "Santuário Lunar",
    description: "Cristais dividem o campo em rotas curtas de aproximação.",
    mood: "Luar arcano",
    image: "/tactical/maps/moon-arena.webp",
    mapId: "santuario-lunar",
  },
  {
    key: "ember",
    name: "Ruínas do Crepúsculo",
    description: "Muralhas quebradas criam flancos longos e um centro disputado.",
    mood: "Crepúsculo antigo",
    image: "/tactical/maps/ember-arena.webp",
    mapId: "ruinas-crepusculo",
  },
];

export function TacticalCombatShell({
  characters,
  creatures,
  initialMapId,
  onVictory,
  onDefeat,
  initialState,
  onCheckpoint,
}: {
  characters: Character[];
  creatures: Creature[];
  initialMapId?: string | null;
  onVictory?: CombatProps["onVictory"];
  onDefeat?: CombatProps["onDefeat"];
  initialState?: CombatProps["initialState"];
  onCheckpoint?: CombatProps["onCheckpoint"];
}) {
  const [started, setStarted] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const selectedScene =
    TACTICAL_SCENES.find((entry) => entry.mapId === initialMapId) ?? TACTICAL_SCENES[0];
  const selectedMap = getTacticalMapById(selectedScene.mapId);
  const shellStyle = { "--tactical-scene-image": `url("${selectedScene.image}")` } as CSSProperties;

  return (
    <div
      className={styles.shell}
      data-tactical-shell
      data-combat-mode={started ? "battle" : "preparation"}
      data-details-open={detailsOpen ? "true" : "false"}
      data-map-scene={selectedScene.key}
      style={shellStyle}
    >
      {!started ? (
        <section className={styles.preparationHeader} data-tactical-preparation>
          <div className={styles.preparationIntro}>
            <span className={styles.eyebrow}>Expedição PvE</span>
            <h1>Prepare-se para o combate</h1>
            <p>A criatura e o campo foram definidos para esta expedição.</p>
          </div>

          <div className={styles.scenePicker} aria-label="Campo de batalha da expedição">
            <article
              className={styles.sceneCard}
              data-scene={selectedScene.key}
              data-scene-key={selectedScene.key}
              data-selected="true"
            >
              <span
                className={styles.scenePreview}
                aria-hidden="true"
                style={{ backgroundImage: `url("${selectedScene.image}")` }}
              />
              <span className={styles.sceneCopy}>
                <small>
                  {selectedScene.mood} · {selectedMap.grid.width}×{selectedMap.grid.height}
                </small>
                <strong>{selectedScene.name}</strong>
                <span>{selectedScene.description}</span>
              </span>
            </article>
          </div>
        </section>
      ) : (
        <div className={styles.battleTopbar} data-tactical-topbar>
          <button type="button" onClick={() => setStarted(false)}>
            <span aria-hidden="true">←</span>Preparação
          </button>
          <div className={styles.battleSceneTitle}>
            <small>
              Campo de batalha · {selectedMap.grid.width}×{selectedMap.grid.height}
            </small>
            <strong>{selectedScene.name}</strong>
          </div>
          <button type="button" onClick={() => setDetailsOpen((value) => !value)}>
            {detailsOpen ? "Fechar painel" : "Log / detalhes"}
          </button>
        </div>
      )}

      <div className={styles.identityWrap} data-tactical-identity>
        <TacticalCombatIdentity characters={characters} creatures={creatures} />
      </div>
      <div className={styles.combatWrap} data-tactical-combat-host>
        <TacticalCombatCore
          key={selectedMap.id}
          mapId={selectedMap.id}
          characters={characters}
          creatures={creatures}
          locked
          onVictory={onVictory}
          onDefeat={onDefeat}
          initialState={initialState}
          onCheckpoint={onCheckpoint}
        />
      </div>
      {!started ? (
        <div className={styles.startArea} data-tactical-start>
          <button className={styles.startButton} type="button" onClick={() => setStarted(true)}>
            <span>Entrar no campo</span>
            <strong>Iniciar combate</strong>
          </button>
        </div>
      ) : null}
    </div>
  );
}
