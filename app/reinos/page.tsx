import { PlayerNav } from "@/components/player-nav";
import Image from "next/image";
import Link from "next/link";
import { WorldMap } from "@/components/world/world-map";
import {
  RealmLocationAtlas,
  RealmLocationModalHost,
} from "@/components/world/realm-location-explorer";
import { realmLore } from "@/lib/game/world-lore";
export const metadata = { title: "Reinos de Wonderland" };
export default function RealmsPage() {
  return (
    <main className="lore-page realms-page">
      <PlayerNav />
      <div className="page-container world-lore-shell">
        <header className="world-lore-hero realms-hero">
          <span className="eyebrow">Atlas dos seis reinos</span>
          <h1>
            Terras de
            <br />
            <em>Wonderland</em>
          </h1>
          <p>
            Do oceano profundo às cidades acima das nuvens: explore territórios, culturas, recursos
            e arquiteturas que formam o mundo conhecido.
          </p>
          <Link className="button button--primary" href="/reinos/atual">
            Reino atual →
          </Link>
          <nav>
            {realmLore.map((realm) => (
              <a href={`#${realm.key}`} key={realm.key}>
                <i style={{ background: realm.color }} />
                {realm.name}
              </a>
            ))}
          </nav>
        </header>
        <WorldMap linkToRealms={false} />
        <section className="realm-dossiers realm-dossiers--atlas">
          {realmLore.map((realm, index) => (
            <article
              id={realm.key}
              key={realm.key}
              style={{ "--realm": realm.color } as React.CSSProperties}
            >
              <header>
                <span>{realm.icon}</span>
                <div>
                  <small>
                    {String(index + 1).padStart(2, "0")} · {realm.title}
                  </small>
                  <h2>{realm.name}</h2>
                  <p>{realm.epithet}</p>
                </div>
                <dl>
                  <div>
                    <dt>Território</dt>
                    <dd>{realm.climate}</dd>
                  </div>
                  <div>
                    <dt>Identidade</dt>
                    <dd>{realm.summary}</dd>
                  </div>
                </dl>
              </header>
              <div className="realm-gallery">
                {[1, 2, 3].map((number) => (
                  <a
                    href={`/images/kingdoms/${realm.key}-${number}.webp`}
                    key={number}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Image
                      alt={`${realm.name} — vista ${number}`}
                      height={1080}
                      src={`/images/kingdoms/${realm.key}-${number}.webp`}
                      width={720}
                    />
                    <span>Vista {String(number).padStart(2, "0")}</span>
                  </a>
                ))}
              </div>
              <div className="realm-dossiers__body">
                <section>
                  <small>O REINO</small>
                  {realm.overview.map((text) => (
                    <p key={text}>{text}</p>
                  ))}
                </section>
                {realm.architecture ? (
                  <section>
                    <small>ARQUITETURA</small>
                    {realm.architecture.map((text) => (
                      <p key={text}>{text}</p>
                    ))}
                  </section>
                ) : null}
              </div>
              <RealmLocationAtlas realmKey={realm.key} />
              {realm.resources || realm.materials ? (
                <footer>
                  {realm.resources ? (
                    <div>
                      <small>PRODUTOS E RECURSOS</small>
                      <ul>
                        {realm.resources.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {realm.materials ? (
                    <div>
                      <small>MATERIAIS PREDOMINANTES</small>
                      <ul>
                        {realm.materials.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </footer>
              ) : null}
            </article>
          ))}
        </section>
      </div>
      <RealmLocationModalHost />
    </main>
  );
}
