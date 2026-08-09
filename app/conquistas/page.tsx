import { PortalShell } from "@/components/portal-shell";
import { achievements } from "@/lib/game/player-portal";
export default function AchievementsPage() {
  return (
    <PortalShell
      eyebrow="Jornada"
      title="Conquistas"
      description="Cada façanha conta um capítulo da sua passagem por Wonderland."
    >
      <div className="portal-card-grid">
        {achievements.map((item, index) => (
          <article className="achievement-card" key={item.slug}>
            <span>{item.icon}</span>
            <small>{String(index + 1).padStart(2, "0")}</small>
            <h2>{item.name}</h2>
            <p>{item.description}</p>
            <em>Bloqueada</em>
          </article>
        ))}
      </div>
    </PortalShell>
  );
}
