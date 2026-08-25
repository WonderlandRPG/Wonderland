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
          aria-label={`Escudo: ${fighter.shield.toLocaleString("pt-BR")} pontos`}
        >
          <CombatStatusGlyph icon="shield" />
          <span className="combat-status-marker">◆</span>
          <span className="combat-status-name">Escudo</span>
          <small className="combat-status-duration">{compactValue(fighter.shield)}</small>
        </span>
      ) : null}
      {statuses.map((status) => {
        const visual = getCombatStatusVisual(status);
        return (
          <span
            className={`combat-status-icon combat-status-icon--${visual.kind}`}
            key={`${status.name}-${status.duration}`}
            title={describeCombatStatus(status)}
            aria-label={describeCombatStatus(status)}
          >
            <CombatStatusGlyph icon={visual.iconKey} />
            <span className="combat-status-marker">{visual.kind === "buff" ? "↑" : "↓"}</span>
            <span className="combat-status-name">{visual.label}</span>
            <small className="combat-status-duration">
              {status.duration > 0 ? `${status.duration}T` : "∞"}
            </small>
          </span>
        );
      })}
    </div>
  );
}

function compactValue(value: number) {
  if (value >= 1000)
    return `${(value / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}k`;
  return value.toLocaleString("pt-BR");
}
