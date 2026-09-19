import Image from "next/image";
import styles from "@/app/rework-grimoire.module.css";
import { PlayerNav } from "@/components/player-nav";
import { getReworkRaces } from "@/lib/content/rework-catalog";

export const metadata = { title: "Raças de Wonderland" };
export const dynamic = "force-dynamic";

export default async function RacesPage() {
  const races = await getReworkRaces();

  return (
    <main className={styles.page}>
      <PlayerNav />
      <div className={styles.inner}>
        <header className={styles.hero}>
          <span>Livro dos Povos</span>
          <h1>As linhagens de Wonderland</h1>
          <p>As 11 raças oficiais do Rework, com atributos básicos, característica exclusiva e duas habilidades raciais sem custo de recurso.</p>
        </header>
        <section className={styles.grid}>{races.map((entry) => <article className={styles.card} data-wl-component="card" key={entry.id}><header className={styles.heading}><span className={styles.sigil}>{entry.sigil}</span><div><h2>{entry.name}</h2><p>{entry.epithet}</p></div></header><div className={styles.body}><p className={styles.description}>{entry.description}</p><div className={styles.stats}>{Object.entries(entry.baseStats).map(([name,value]) => <div key={name}><small>{name}</small><strong>{value}</strong></div>)}</div><div className={styles.skills}>{entry.powers.map((power) => <article className={styles.skill} key={power.id}><Image alt="" height={52} src={power.iconUrl} width={52}/><div><h3>{power.name}</h3><p>{power.description}</p><div className={styles.meta}><span>{power.kind}</span><span>Nível {power.unlockLevel}</span>{power.cooldown ? <span>Recarga: {power.cooldown}</span> : null}{power.range ? <span>Alcance: {power.range}</span> : null}{power.area ? <span>Área: {power.area}</span> : null}</div></div></article>)}</div></div></article>)}</section>
      </div>
    </main>
  );
}
