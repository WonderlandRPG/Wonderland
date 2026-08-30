import type { ReactNode } from "react";

import { EquippedTitle, type EquippedTitleData } from "@/components/characters/equipped-title";
import { RankAtmosphere } from "@/components/characters/rank-atmosphere";
import { RankBadge } from "@/components/characters/rank-badge";
import type { CharacterCosmeticLoadout } from "@/lib/content/character-cosmetics";
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
  cosmetics: CharacterCosmeticLoadout | undefined;
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
      data-character-card="official"
      data-rank={rank}
      data-card-cosmetic={cosmetics?.card ?? undefined}
      data-aura-cosmetic={cosmetics?.aura ?? undefined}
      data-border-cosmetic={cosmetics?.border ?? undefined}
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

      <div className={styles.cosmeticCardFx} aria-hidden="true">
        <i className={styles.bloodMoon} />
        <i className={styles.graveyard} />
        <i className={styles.ravenOne} />
        <i className={styles.ravenTwo} />
        <i className={styles.candleOne} />
        <i className={styles.candleTwo} />
        <i className={styles.cardFogOne} />
        <i className={styles.cardFogTwo} />
      </div>

      <div className={styles.cosmeticBorderFx} aria-hidden="true">
        <img
          alt=""
          className={styles.borderArtwork}
          src="/cosmetics/cemiterio-lua-sangrenta/portico-lua-sangrenta-v3.png"
        />
      </div>

      <div className={styles.cosmeticAuraFx} aria-hidden="true">
        <i className={[styles.soul, styles.soulOne].join(" ")} />
        <i className={[styles.soul, styles.soulTwo].join(" ")} />
        <i className={[styles.soul, styles.soulThree].join(" ")} />
        <i className={[styles.soul, styles.soulFour].join(" ")} />
        <i className={[styles.soul, styles.soulFive].join(" ")} />
        <i className={[styles.soul, styles.soulSix].join(" ")} />
        <i className={[styles.soul, styles.soulSeven].join(" ")} />
        <i className={styles.ashField} />
      </div>

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
