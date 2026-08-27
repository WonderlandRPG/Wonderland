import { PortalShell } from "@/components/portal-shell";
import { RankAtmosphere } from "@/components/characters/rank-atmosphere";
import { RankBadge } from "@/components/characters/rank-badge";
import { adventureRanks, guildTrials } from "@/lib/game/ranks";

export const metadata = { title: "Ranks" };

export default async function RanksPage() {
  return (
    <PortalShell eyebrow="Arquivo da Guilda" title="Patentes dos Aventureiros" description="Decretos oficiais que definem prestígio, autorização e deveres em Wonderland.">
      <section className="guild-decrees">
        <header className="guild-decrees__intro">
          <span className="guild-decrees__wax">W</span>
          <div><small>DECRETO DE CLASSIFICAÇÃO</small><h2>Nível mede crescimento. Rank mede reconhecimento.</h2><p>Para ascender, um aventureiro precisa cumprir os requisitos de sua patente, concluir missões e vencer a Prova da Guilda correspondente.</p></div>
        </header>

        <div className="guild-decrees__roll">
          {adventureRanks.map((rank, index) => (
            <article className={`guild-decree ${rank.key === "EX" ? "is-ex" : ""}`} data-rank={rank.key} key={rank.key} style={{ "--rank-color": rank.color } as React.CSSProperties}>
              <div className="guild-decree__index">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <RankBadge rank={rank.key} />
                <small>{rank.colorName}</small>
              </div>
              <div className="guild-decree__copy"><small>{rank.title}</small><h2>Patente {rank.key}</h2><p>{rank.description}</p><ul>{rank.access.map((item) => <li key={item}>{item}</li>)}</ul></div>
              <aside className="guild-decree__rank-effect">
                <small>EFEITO DO RANK</small>
                <div className="rank-effect-preview">
                  <RankAtmosphere rank={rank.key} variant="preview" />
                  <RankBadge compact rank={rank.key} />
                </div>
                <strong>{rank.atmosphere}</strong>
                <p>{rank.effectDescription}</p>
                <span>Aplicado aos retratos e ao Inventário</span>
              </aside>
            </article>
          ))}
        </div>

        <section className="guild-trials-scroll">
          <header><span>✦</span><div><small>RITO DE ASCENSÃO</small><h2>Provas da Guilda</h2><p>Cada nova patente exige um feito digno do reconhecimento dos reinos.</p></div></header>
          <div>{guildTrials.map((trial) => <article key={trial.from}><span className="guild-trial-route"><b>{trial.from.split(" → ")[0]}</b><i>→</i><b>{trial.from.split(" → ")[1]}</b></span><div><small>PROVA OFICIAL</small><h3>{trial.name}</h3><p>{trial.description}</p></div></article>)}</div>
        </section>
      </section>
    </PortalShell>
  );
}
