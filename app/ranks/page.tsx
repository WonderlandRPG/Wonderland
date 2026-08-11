import { PortalShell } from "@/components/portal-shell";
import { RankBadge } from "@/components/characters/rank-badge";
import { adventureRanks, guildTrials } from "@/lib/game/ranks";

export const metadata = { title: "Ranks" };

export default async function RanksPage() {
  return (
    <PortalShell
      eyebrow="Guilda dos Aventureiros"
      title="Ascenda além do comum"
      description="Os Ranks definem as missões, dungeons e ameaças que um aventureiro está autorizado a enfrentar."
    >
      <section className="ranks-intro-card">
        <div>
          <span className="eyebrow">Como funciona</span>
          <h2>Nível e Rank são sistemas diferentes</h2>
        </div>
        <p>
          O nível mede a evolução individual. O Rank mede prestígio, experiência comprovada e
          autorização oficial da Guilda. Para ascender, o personagem deve cumprir requisitos,
          concluir missões e vencer uma Prova da Guilda.
        </p>
      </section>
      <blockquote className="ranks-quote">
        “O nível mostra o quanto você cresceu. O Rank mostra aquilo que o mundo reconhece em você.”
      </blockquote>
      <section className="rank-guide rank-ladder">
        {adventureRanks.map((rank, index) => (
          <article
            className={`rank-guide-card ${rank.key === "EX" ? "is-ex" : ""}`}
            key={rank.key}
            style={{ "--rank-color": rank.color } as React.CSSProperties}
          >
            <span className="rank-guide-card__order">{String(index + 1).padStart(2, "0")}</span>
            <RankBadge rank={rank.key} />
            <div>
              <small>{rank.title}</small>
              <h2>Rank {rank.key}</h2>
              <p>{rank.description}</p>
              <aside className="rank-guide-card__effect">
                <span aria-hidden="true">✦</span>
                <div>
                  <small>Efeito exclusivo</small>
                  <strong>{rank.effect.name}</strong>
                  <p>{rank.effect.summary}</p>
                </div>
              </aside>
              <ul>
                {rank.access.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </section>
      <section className="guild-trials">
        <header>
          <span className="eyebrow">Ascensão oficial</span>
          <h2>Provas da Guilda</h2>
          <p>Cada promoção exige um feito digno do novo Rank.</p>
        </header>
        <div className="trial-grid">
          {guildTrials.map((trial) => (
            <article key={trial.from}>
              <span>{trial.from}</span>
              <h3>{trial.name}</h3>
              <p>{trial.description}</p>
            </article>
          ))}
        </div>
      </section>
    </PortalShell>
  );
}
