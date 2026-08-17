import type { CSSProperties } from "react";
import styles from "./equipped-title.module.css";

export type EquippedTitleData = {
  name: string;
  rarity: string;
  titleStyle: { primary: string; secondary: string; glow: string } | null;
};

const defaultStyle = {
  primary: "#fff1b5",
  secondary: "#1f7a4c",
  glow: "#d7ad45",
};

export function EquippedTitle({ title }: { title: EquippedTitleData | null }) {
  if (!title) return null;
  const visual = title.titleStyle ?? defaultStyle;

  return (
    <span
      aria-label={`Título equipado: ${title.name}`}
      className={`${styles.title} character-equipped-title`}
      data-title={title.rarity}
      style={
        {
          "--title-primary": visual.primary,
          "--title-secondary": visual.secondary,
          "--title-glow": visual.glow,
        } as CSSProperties
      }
      title={`Título equipado: ${title.name}`}
    >
      <i aria-hidden="true" className={styles.sigil}>✦</i>
      <span className={styles.name}>{title.name}</span>
    </span>
  );
}
