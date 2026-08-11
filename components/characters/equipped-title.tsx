import type { CSSProperties } from "react";

export type EquippedTitleData = {
  name: string;
  rarity: string;
  titleStyle: { primary: string; secondary: string; glow: string } | null;
};

export function EquippedTitle({ title }: { title: EquippedTitleData | null }) {
  if (!title) return null;
  return (
    <div
      className="character-equipped-title"
      data-title={title.rarity}
      style={{
        "--title-primary": title.titleStyle?.primary ?? "#fff1b5",
        "--title-secondary": title.titleStyle?.secondary ?? "#1f7a4c",
        "--title-glow": title.titleStyle?.glow ?? "#d7ad45",
      } as CSSProperties}
    >
      ✦ {title.name}
    </div>
  );
}
