import Image from "next/image";
import styles from "@/app/rework-grimoire.module.css";
import { PlayerNav } from "@/components/player-nav";
import { getReworkClasses } from "@/lib/content/rework-catalog";

export const metadata = { title: "Classes de Wonderland" };
export const dynamic = "force-dynamic";

export default async function ClassesPage() {
  const classes = await getReworkClasses();

  return (
    <main className={styles.page}>
      <PlayerNav />
      <div className={styles.inner}>
        <header className={styles.hero}>
          <span>Grimório das Vocações</span>
          <h1>Escolha o seu caminho</h1>
          <p>As 17 classes oficiais do Rework, com passiva, ataque básico, três habilidades, Suprema e três caminhos de especialização.</p>
        </header>
        <section className={styles.grid}>{classes.map((entry) => <article className={styles.card} data-wl-component="card" key={entry.id}><header className={styles.heading}><span className={styles.sigil}>{entry.sigil}</span><div><h2>{entry.name}</h2><p>{entry.role}</p></div></header><div className={styles.body}><p className={styles.description}>{entry.description}</p><div className={styles.paths}>{entry.paths.map((path) => <span key={path.id}>{path.name}</span>)}</div><div className={styles.skills}>{entry.abilities.map((ability) => <article className={styles.skill} key={ability.id}><Image alt="" height={52} src={ability.iconUrl} width={52}/><div><h3>{ability.name}</h3><p>{ability.description}</p><div className={styles.meta}><span>{ability.kind}</span><span>Nível {ability.unlockLevel}</span><span>Recarga: {ability.cooldown}</span><span>Alcance: {ability.combat.range}</span><span>Área: {ability.combat.area}</span></div></div></article>)}</div></div></article>)}</section>
      </div>
    </main>
  );
}
