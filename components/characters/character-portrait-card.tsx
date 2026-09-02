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
  const borderArtwork =
    cosmetics?.border === "moldura-colheita-noturna"
      ? "/cosmetics/halloween-2026/colheita-da-meia-noite.png"
      : cosmetics?.border === "moldura-fundadores-2026"
        ? "/cosmetics/inauguracao/moldura-fundadores-2026.png"
        : null;

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
        {cosmetics?.card === "vigilia-do-cemiterio" ? <img alt="" className={styles.cardArtwork} src="/cosmetics/halloween-2026/vigilia-do-cemiterio.png" /> : null}
        <i className={styles.voidEclipse} />
        <i className={styles.branchVeil} />
        <i className={styles.emberField} />
        <i className={styles.cardMistOne} />
        <i className={styles.cardMistTwo} />
      </div>

      <div className={styles.cosmeticBorderFx} aria-hidden="true">
        {borderArtwork ? <img alt="" className={styles.borderArtwork} src={borderArtwork} /> : null}
      </div>

      <div className={styles.cosmeticAuraFx} aria-hidden="true">
        {cosmetics?.aura === "voo-da-bruxa" ? <img alt="" className={styles.witchArtwork} src="/cosmetics/halloween-2026/voo-da-bruxa.png" /> : null}
        <i className={[styles.wisp, styles.wispOne].join(" ")} />
        <i className={[styles.wisp, styles.wispTwo].join(" ")} />
        <i className={[styles.wisp, styles.wispThree].join(" ")} />
        <i className={[styles.wisp, styles.wispFour].join(" ")} />
        <i className={[styles.wisp, styles.wispFive].join(" ")} />
        <i className={styles.spectralRing} />
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
