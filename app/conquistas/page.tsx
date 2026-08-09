import { PortalShell } from "@/components/portal-shell";
import { requireActiveCharacter } from "@/lib/content/active-character";
import { achievements } from "@/lib/game/player-portal";
export default async function AchievementsPage() {
  await requireActiveCharacter("/conquistas");
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
