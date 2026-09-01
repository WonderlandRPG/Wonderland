import type { CSSProperties } from "react";
import { defaultTitleStyle, parseTitleStyle, type TitleStyle } from "@/lib/game/title-style";
import styles from "./equipped-title.module.css";

export type EquippedTitleData = {
  name: string;
  rarity: string;
  titleStyle: Partial<TitleStyle> | null;
  description?: string | null;
  attributes?: Partial<Record<"FOR" | "DEF" | "RES" | "INI" | "INT" | "ARC", number>>;
};

const rarityLabels: Record<string, string> = { common:"Comum",uncommon:"Incomum",rare:"Raro",epic:"Épico",legendary:"Lendário",mythic:"Mítico",awakened:"Desperto" };
const categoryLabels: Record<string, string> = { commemorative:"Comemorativo",achievement:"Conquista",competitive:"Competitivo",exploration:"Exploração",social:"Social",legendary:"Lendário",administrative:"Administrativo" };

export function EquippedTitle({ title }: { title: EquippedTitleData | null }) {
  if (!title) return null;
  const visual = parseTitleStyle(title.titleStyle ?? defaultTitleStyle);
  const bonuses = Object.entries(title.attributes ?? {}).filter(([, value]) => Number(value) > 0);
  const tooltipId = `title-${title.name.normalize("NFD").replace(/[^a-zA-Z0-9]/g, "-")}`;

  return (
    <span aria-describedby={tooltipId} className={styles.root} tabIndex={0}>
      <span
        aria-label={`Título equipado: ${title.name}`}
        className={`${styles.title} character-equipped-title`}
        data-title={title.rarity}
        data-frame={visual.frame}
        data-category={visual.category}
        data-animated={visual.animated ? "true" : "false"}
        style={{
          "--title-primary": visual.primary,
          "--title-secondary": visual.secondary,
          "--title-glow": visual.glow,
          "--title-accent": visual.accent,
        } as CSSProperties}
      >
        <i aria-hidden="true" className={styles.aura} />
        <i aria-hidden="true" className={styles.flourish}>◆</i>
        <i aria-hidden="true" className={styles.sigil}><span className={styles.sigilGlyph}>{visual.sigil}</span></i>
        <span className={styles.name}>{title.name}</span>
        <i aria-hidden="true" className={styles.flourish}>◆</i>
      </span>
      <span className={styles.tooltip} id={tooltipId} role="tooltip">
        <span className={styles.tooltipHeader}><strong>{title.name}</strong><span>{rarityLabels[title.rarity] ?? title.rarity}</span></span>
        <span className={styles.description}>{title.description ?? `${categoryLabels[visual.category] ?? "Honraria"} de Wonderland.`}</span>
        <span className={styles.acquisition}><b>Obtenção:</b> {visual.acquisition}</span>
        {bonuses.length ? <ul className={styles.attributes}>{bonuses.map(([key,value]) => <li key={key}>+{value} {key}</li>)}</ul> : null}
      </span>
    </span>
  );
}
