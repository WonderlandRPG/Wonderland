"use client";

import { ItemGlyph } from "@/components/items/item-glyph";
import styles from "./item-visuals.module.css";

type ItemArtworkProps = {
  name: string;
  rarity: string;
  slot: string;
  imageUrl?: string | null;
  className?: string;
};

export function ItemArtwork({ name, rarity, slot, imageUrl, className }: ItemArtworkProps) {
  return (
    <span
      className={`${styles.artwork}${imageUrl ? ` ${styles.hasImage}` : ""}${className ? ` ${className}` : ""}`}
      data-rarity={rarity}
    >
      {imageUrl ? (
        <span
          aria-label={`Imagem de ${name}`}
          className={styles.image}
          role="img"
          style={{
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: "contain",
            inset: "7%",
          }}
        />
      ) : (
        <span className={styles.fallback}>
          <ItemGlyph slot={slot} />
          <small>{name}</small>
        </span>
      )}
    </span>
  );
}
