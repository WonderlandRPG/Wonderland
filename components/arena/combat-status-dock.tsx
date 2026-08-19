import { CombatStatusGlyph } from "@/components/arena/combat-status-glyph";
import type { CombatantState } from "@/lib/game/combat";
import { describeCombatStatus, getCombatStatusVisual } from "@/lib/game/combat-status-visual";

export function CombatStatusDock({ fighter }: { fighter: CombatantState }) {
  const statuses = Object.values(fighter.statuses);
  if (!statuses.length && fighter.shield <= 0) return null;

  return (
    <div className="combat-status-dock" aria-label="Efeitos ativos">
      {fighter.shield > 0 ? (
        <span
          className="combat-status-icon combat-status-icon--shield"
          title={`Escudo ativo · ${fighter.shield.toLocaleString("pt-BR")} pontos`}
        >
          <CombatStatusGlyph icon="shield" />
          <i>+</i>
          <small>{fighter.shield.toLocaleString("pt-BR")}</small>
        </span>
      ) : null}
      {statuses.map((status) => {
        const visual = getCombatStatusVisual(status);
        return (
          <span
            className={`combat-status-icon combat-status-icon--${visual.kind}`}
            key={`${status.name}-${status.duration}`}
            title={describeCombatStatus(status)}
          >
            <CombatStatusGlyph icon={visual.iconKey} />
            <i>{visual.kind === "buff" ? "↑" : "↓"}</i>
            <small>{status.duration > 0 ? `${status.duration}T` : "∞"}</small>
          </span>
        );
      })}
    </div>
  );
}
