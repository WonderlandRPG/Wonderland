import type { CSSProperties } from "react";
import { defaultTitleStyle, parseTitleStyle, type TitleStyle } from "@/lib/game/title-style";
import styles from "./equipped-title.module.css";

export type EquippedTitleData = {
  name: string;
  rarity: string;
  titleStyle: Partial<TitleStyle> | null;
};

export function EquippedTitle({ title }: { title: EquippedTitleData | null }) {
  if (!title) return null;
  const visual = parseTitleStyle(title.titleStyle ?? defaultTitleStyle);

  return (
    <span
      aria-label={`Título equipado: ${title.name}`}
      className={`${styles.title} character-equipped-title`}
      data-title={title.rarity}
      data-frame={visual.frame}
      data-category={visual.category}
      data-animated={visual.animated ? "true" : "false"}
      style={
        {
          "--title-primary": visual.primary,
          "--title-secondary": visual.secondary,
          "--title-glow": visual.glow,
          "--title-accent": visual.accent,
        } as CSSProperties
      }
      title={`${title.name} — ${visual.acquisition}`}
    >
      <i aria-hidden="true" className={styles.flourish}>
        ◆
      </i>
      <i aria-hidden="true" className={styles.sigil}>
        {visual.sigil}
      </i>
      <span className={styles.name}>{title.name}</span>
      <i aria-hidden="true" className={styles.flourish}>
        ◆
      </i>
    </span>
  );
}
