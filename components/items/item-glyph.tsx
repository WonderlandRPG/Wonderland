import styles from "./item-visuals.module.css";

const slotGlyphs: Record<string, string> = {
  head: "♜",
  torso: "⬡",
  hands: "✥",
  legs: "Ⅱ",
  feet: "⌁",
  main_weapon: "⚔",
  off_weapon: "◇",
  necklace: "◊",
  ring: "○",
  earring: "◌",
  cape: "♢",
  title: "✦",
};

export function ItemGlyph({ slot, className }: { slot: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`${styles.glyph}${className ? ` ${className}` : ""}`}
      data-slot={slot}
    >
      {slotGlyphs[slot] ?? "◆"}
    </span>
  );
}
