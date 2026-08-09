import Link from "next/link";
import { PlayerNav } from "@/components/player-nav";
import { portalEvents, updates } from "@/lib/game/player-portal";
const realms = [
  {
    name: "Aokigahara",
    title: "Reino da Floresta",
    text: "Árvores ancestrais, pactos druidas e caminhos que mudam sob seus pés.",
  },
  {
    name: "Oymyakon",
    title: "Reino do Gelo",
    text: "Além da tempestade perpétua, sobreviventes guardam segredos congelados.",
  },
  {
    name: "Lesedi",
    title: "Reino de Areia",
    text: "Dunas douradas, planaltos e cidades que florescem contra o sol.",
  },
  {
    name: "Skypiece",
    title: "Reino Celestial",
    text: "Ilhas flutuantes voltaram aos céus após séculos de silêncio.",
  },
];
export default function Home() {
  return (
    <main className="home-shell player-home">
      <section className="hero player-hero">
        <div className="hero__backdrop" />
        <div className="hero__grid" />
        <PlayerNav />
        <div className="hero__content page-container">
          <div className="hero__status">
            <span className="signal-dot" /> Temporada inaugural aberta
          </div>
          <p className="hero__kicker">Wonderland RPG // Crie sua lenda</p>
          <h1>
            Os portões <span>estão abertos.</span>
          </h1>
          <p className="hero__lead">
            Escolha seu caminho, conheça outros aventureiros e escreva uma história capaz de
            atravessar todos os reinos.
          </p>
          <div className="hero__actions">
            <Link className="button button--primary" href="/cadastro">
              Começar minha jornada <span>→</span>
            </Link>
            <Link className="button button--ghost" href="/ranking">
              Ver aventureiros
            </Link>
          </div>
        </div>
        <div className="hero__telemetry">
          <div>
            <span>01</span>
            <strong>Crie sua conta</strong>
            <small>Sua identidade no mundo</small>
          </div>
          <div>
            <span>02</span>
            <strong>Ganhe experiência</strong>
            <small>Evolua a cada aventura</small>
          </div>
          <div>
            <span>03</span>
            <strong>Deixe sua marca</strong>
            <small>Conquistas e ranking</small>
          </div>
        </div>
      </section>
      <section className="realm-section page-container">
        <span className="eyebrow">Explore Wonderland</span>
        <h2>Quatro reinos. Infinitas histórias.</h2>
        <div className="realm-grid">
          {realms.map((realm, i) => (
            <article key={realm.name}>
              <span>0{i + 1}</span>
              <small>{realm.title}</small>
              <h3>{realm.name}</h3>
              <p>{realm.text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="player-features">
        <div className="page-container">
          <span className="eyebrow">Sua jornada continua</span>
          <h2>Todo dia traz uma nova razão para voltar.</h2>
          <div className="feature-grid">
            <Link href="/conquistas">
              <span>✦</span>
              <h3>Conquistas</h3>
              <p>Registre façanhas e exiba os marcos da sua aventura.</p>
            </Link>
            <Link href="/loja">
              <span>◆</span>
              <h3>Loja e recompensas</h3>
              <p>Conquiste moedas e encontre itens para sua identidade.</p>
            </Link>
            <Link href="/ranking">
              <span>♜</span>
              <h3>Ranking</h3>
              <p>Compare sua evolução com aventureiros de todos os reinos.</p>
            </Link>
          </div>
        </div>
      </section>
      <section className="home-news page-container">
        <div>
          <span className="eyebrow">Próximo evento</span>
          <time>{portalEvents[0].date}</time>
          <h2>{portalEvents[0].title}</h2>
          <p>{portalEvents[0].description}</p>
          <Link href="/eventos">Ver calendário completo →</Link>
        </div>
        <div>
          <span className="eyebrow">Última atualização</span>
          <small>v{updates[0].version}</small>
          <h2>{updates[0].title}</h2>
          <ul>
            {updates[0].notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
          <Link href="/atualizacoes">Ler diário de atualizações →</Link>
        </div>
      </section>
      <section className="launch-section">
        <div className="page-container launch-section__inner">
          <div>
            <span className="eyebrow">Sua história começa aqui</span>
            <h2>O mundo precisa de novos nomes.</h2>
            <p>Crie sua conta gratuitamente e atravesse os portões de Wonderland.</p>
          </div>
          <Link className="button button--primary" href="/cadastro">
            Criar minha conta <span>→</span>
          </Link>
        </div>
      </section>
      <footer className="site-footer page-container">
        <span>Wonderland RPG</span>
        <small>Um mundo criado para histórias inesquecíveis.</small>
        <small>© 2026 Wonderland Ltda.</small>
      </footer>
    </main>
  );
}
