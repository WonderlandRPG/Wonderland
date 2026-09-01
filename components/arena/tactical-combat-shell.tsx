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

export function TacticalCombatShell({
  characters,
  creatures,
}: {
  characters: Character[];
  creatures: Creature[];
}) {
  const [started, setStarted] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  return (
    <div
      className={styles.shell}
      data-combat-mode={started ? "battle" : "preparation"}
      data-details-open={detailsOpen ? "true" : "false"}
    >
      {!started ? (
        <section className={styles.preparationHeader}>
          <div>
            <small>Preparação</small>
            <h1>Prepare o combate</h1>
            <p>Escolha o aventureiro e a criatura. As informações técnicas ficam fora da luta.</p>
          </div>
        </section>
      ) : (
        <div className={styles.battleTopbar}>
          <button type="button" onClick={() => setStarted(false)}>
            ← Preparação
          </button>
          <span>Combate tático</span>
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
