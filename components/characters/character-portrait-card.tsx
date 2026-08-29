import type { ReactNode } from "react";
import type { CharacterCosmeticLoadout } from "@/lib/content/character-cosmetics";

import { EquippedTitle, type EquippedTitleData } from "@/components/characters/equipped-title";
import { RankAtmosphere } from "@/components/characters/rank-atmosphere";
import { RankBadge } from "@/components/characters/rank-badge";
import styles from "./character-portrait-card.module.css";

type CharacterPortraitCardProps = {
  name: string;
  imageUrl: string | null;
  rank: string;
  level: number;
  title: EquippedTitleData | null;
  variant?: "hero" | "standard" | "compact" | "inventory";
  className?: string;
  children?: ReactNode;
  cosmetics?: Pick<CharacterCosmeticLoadout, "card" | "frame" | "aura">;
};

export function CharacterPortraitCard({
  name,
  imageUrl,
  rank,
  level,
  title,
  variant = "standard",
  className,
  children,
  cosmetics,
}: CharacterPortraitCardProps) {
  return (
    <div
      className={[styles.card, styles[variant], className].filter(Boolean).join(" ")}
      data-aura-cosmetic={cosmetics?.aura ?? undefined}
      data-card-cosmetic={cosmetics?.card ?? undefined}
      data-character-card="official"
      data-frame-cosmetic={cosmetics?.frame ?? undefined}
      data-rank={rank}
    >
      <div
        aria-label={`Retrato de ${name}`}
        className={`${styles.image} ${imageUrl ? styles.hasImage : ""}`}
        role="img"
        style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}
      >
        {imageUrl ? null : <span className={styles.fallback}>{name.slice(0, 2).toUpperCase()}</span>}
      </div>

      <RankAtmosphere rank={rank} />
      <span aria-hidden="true" className={styles.cosmeticAura} />
      <span aria-hidden="true" className={styles.cosmeticFrame} />

      <div className={styles.topMeta}>
        <div className={styles.rankMeta}>
          <RankBadge rank={rank} />
        </div>
        <div className={styles.levelMeta}>
          <small>Nível</small>
          <strong>{level}</strong>
        </div>
      </div>

      <div className={styles.titleMeta}>
        {title ? <EquippedTitle title={title} /> : <span className={styles.noTitle}>Sem título</span>}
      </div>

      {children ? <div className={styles.overlay}>{children}</div> : null}
    </div>
  );
}
