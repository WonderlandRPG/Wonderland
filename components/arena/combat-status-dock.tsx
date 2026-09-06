import type { CombatantState } from "@/lib/game/combat";
import { describeCombatStatus, getCombatStatusVisual } from "@/lib/game/combat-status-visual";

const STATUS_EMOJI = {
  for: "⚔️", def: "🛡️", res: "💚", ini: "⚡", int: "✨", arc: "🔮",
  bleed: "🩸", poison: "☠️", burn: "🔥", silence: "🤐", stun: "💫",
  regen: "💖", shield: "🛡️", root: "🌿", fear: "😨", blind: "🌑",
  curse: "🕯️", taunt: "🎯", immune: "🛡️", stealth: "🌫️", haste: "⚡",
  slow: "🐌", vulnerable: "💔", summon: "🐾", form: "🐺", buff: "⬆️", debuff: "⬇️",
} as const;

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
          <span className="combat-status-emoji" aria-hidden="true">🛡️</span>
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
            <span className="combat-status-emoji" aria-hidden="true">{STATUS_EMOJI[visual.iconKey]}</span>
            <span className="combat-status-name">{visual.label}</span>
            <small className="combat-status-duration">
              {status.duration >= 900 || status.duration <= 0 ? "Permanente" : `${status.duration} turno${status.duration === 1 ? "" : "s"}`}
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
