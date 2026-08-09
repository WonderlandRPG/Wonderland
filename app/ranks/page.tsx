import { PortalShell } from "@/components/portal-shell";
import { RankBadge } from "@/components/characters/rank-badge";
import { requireActiveCharacter } from "@/lib/content/active-character";
import { adventureRanks } from "@/lib/game/ranks";

export const metadata = { title: "Ranks" };

export default async function RanksPage() {
  await requireActiveCharacter("/ranks");
  return (
    <PortalShell
      eyebrow="Escala dos aventureiros"
      title="Ranks de Wonderland"
      description="Todo personagem começa no Rank E. O avanço representa reconhecimento, responsabilidade e feitos dentro do mundo."
    >
      <section className="rank-guide">
        {adventureRanks.map((rank, index) => (
          <article
            className={`rank-guide-card ${rank.key === "EX" ? "is-ex" : ""}`}
            key={rank.key}
            style={{ "--rank-color": rank.color } as React.CSSProperties}
          >
            <span className="rank-guide-card__order">{String(index + 1).padStart(2, "0")}</span>
            <RankBadge rank={rank.key} />
            <div>
              <h2>Rank {rank.key}</h2>
              <p>{rank.description}</p>
            </div>
          </article>
        ))}
      </section>
    </PortalShell>
  );
}
