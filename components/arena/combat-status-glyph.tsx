import {
  COMBAT_STATUS_ICON_PATHS,
  type CombatStatusIconKey,
} from "@/lib/game/combat-status-visual";

export function CombatStatusGlyph({ icon }: { icon: CombatStatusIconKey }) {
  return (
    <span className={`combat-status-glyph combat-status-glyph--${icon}`} aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false">
        {COMBAT_STATUS_ICON_PATHS[icon].map((path) => (
          <path d={path} key={path} />
        ))}
      </svg>
    </span>
  );
}
