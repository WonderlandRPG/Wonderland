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
type TacticalScene = "forest" | "ruins" | "veil";

const TACTICAL_SCENES: Array<{ key: TacticalScene; name: string; description: string }> = [
  { key: "forest", name: "Bosque Místico", description: "Clareira ancestral tomada por musgo e energia feérica." },
  { key: "ruins", name: "Ruínas de Verdantia", description: "Pátio de pedra de uma civilização esquecida." },
  { key: "veil", name: "Véu Sombrio", description: "Clareira noturna marcada por brilho espectral." },
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
          <div>
            <small>Preparação</small>
            <h1>Prepare o combate</h1>
            <p>Escolha o aventureiro, a criatura e o cenário. As informações técnicas ficam fora da luta.</p>
          </div>
          <label data-scene-picker>
            <span>Cenário</span>
            <select
              name="tactical-scene"
              value={scene}
              onChange={(event) => setScene(event.target.value as TacticalScene)}
            >
              {TACTICAL_SCENES.map((entry) => (
                <option key={entry.key} value={entry.key}>{entry.name}</option>
              ))}
            </select>
            <small>{selectedScene.description}</small>
          </label>
        </section>
      ) : (
        <div className={styles.battleTopbar}>
          <button type="button" onClick={() => setStarted(false)}>
            ← Preparação
          </button>
          <span>{selectedScene.name}</span>
          <button type="button" onClick={() => setDetailsOpen((value) => !value)}>
            {detailsOpen ? "Fechar detalhes" : "Log / detalhes"}
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
            Iniciar combate
          </button>
        </div>
      ) : null}
    </div>
  );
}
