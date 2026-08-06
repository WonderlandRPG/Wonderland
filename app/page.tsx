import Link from "next/link";

import { SectionHeading } from "@/components/section-heading";
import { SiteHeader } from "@/components/site-header";
import { contentCatalog } from "@/lib/game/catalog";

const foundations = [
  {
    index: "01",
    title: "Uma fonte de regras",
    description:
      "Ficha, Arena e criação de personagem usam o mesmo motor para nível, atributos, HP, Mana e dano.",
  },
  {
    index: "02",
    title: "Conteúdo administrável",
    description:
      "Raças, classes, habilidades, itens e progressão deixam de ficar espalhados em arquivos diferentes.",
  },
  {
    index: "03",
    title: "Publicação segura",
    description:
      "Toda mudança passa por rascunho, validação, publicação e histórico antes de chegar aos jogadores.",
  },
];

export default function Home() {
  return (
    <main className="home-shell">
      <section className="hero">
        <div className="hero__backdrop" />
        <div className="hero__grid" />
        <SiteHeader />

        <div className="hero__content page-container">
          <div className="hero__status">
            <span className="signal-dot" />
            Nova fundação em desenvolvimento
          </div>
          <p className="hero__kicker">Wonderland // Core v2.0</p>
          <h1>
            Um mundo vivo.
            <span>Uma única fonte de verdade.</span>
          </h1>
          <p className="hero__lead">
            O Wonderland está sendo reconstruído para crescer como um RPG online de verdade:
            organizado, seguro e inteiramente controlável pelo painel.
          </p>
          <div className="hero__actions">
            <a className="button button--primary" href="#fundacao">
              Explorar a fundação
              <span aria-hidden="true">↘</span>
            </a>
            <Link className="button button--ghost" href="/admin">
              Ver central ADM
            </Link>
          </div>
        </div>

        <div className="hero__telemetry" aria-label="Princípios da nova base">
          <div>
            <span>01</span>
            <strong>Motor central</strong>
            <small>Sem cálculos duplicados</small>
          </div>
          <div>
            <span>02</span>
            <strong>Dados versionados</strong>
            <small>Rascunho e publicação</small>
          </div>
          <div>
            <span>03</span>
            <strong>Painel modular</strong>
            <small>Conteúdo sem editar código</small>
          </div>
        </div>
      </section>

      <section className="foundation-section page-container" id="fundacao">
        <SectionHeading
          eyebrow="Nova arquitetura"
          title="Reconstruída desde o primeiro comando."
          description="A versão anterior cresceu além da estrutura para a qual havia sido criada. A nova base nasce preparada para contas, personagens, combate, conteúdo e administração."
        />

        <div className="foundation-grid">
          {foundations.map((foundation) => (
            <article className="foundation-card" key={foundation.index}>
              <span className="foundation-card__index">{foundation.index}</span>
              <div className="foundation-card__line" />
              <h3>{foundation.title}</h3>
              <p>{foundation.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="flow-section">
        <div className="page-container flow-section__inner">
          <SectionHeading
            eyebrow="Fluxo único"
            title="O painel altera. Todo o jogo responde."
            description="Uma mudança publicada deixa de depender de correções repetidas em cada página."
          />
          <div className="system-flow" aria-label="Fluxo central de dados do Wonderland">
            <div className="system-flow__node system-flow__node--primary">
              <span>Entrada</span>
              <strong>Painel ADM</strong>
              <small>Cria, valida e publica</small>
            </div>
            <div className="system-flow__connector">
              <span />
              <em>Dados validados</em>
            </div>
            <div className="system-flow__node">
              <span>Núcleo</span>
              <strong>Supabase</strong>
              <small>Conteúdo + histórico</small>
            </div>
            <div className="system-flow__connector">
              <span />
              <em>Regras oficiais</em>
            </div>
            <div className="system-flow__outputs">
              <span>Ficha</span>
              <span>Arena</span>
              <span>Dungeons</span>
            </div>
          </div>
        </div>
      </section>

      <section className="systems-section page-container" id="sistemas">
        <SectionHeading
          eyebrow="Ecossistema administrável"
          title="Cada sistema já nasce como um módulo."
          description="As categorias abaixo fazem parte do mesmo catálogo central e receberão editores próprios no painel."
        />
        <div className="module-grid">
          {contentCatalog.map((module) => (
            <article className="module-card" key={module.key}>
              <span className="module-card__glyph">{module.glyph}</span>
              <div>
                <h3>{module.label}</h3>
                <p>{module.description}</p>
              </div>
              <span className="module-card__state">Mapeado</span>
            </article>
          ))}
        </div>
      </section>

      <section className="launch-section">
        <div className="page-container launch-section__inner">
          <div>
            <span className="eyebrow">Primeira operação</span>
            <h2>A central de comando já tem uma nova base.</h2>
            <p>
              O próximo passo será conectar o Supabase e ativar contas, funções e permissões
              administrativas.
            </p>
          </div>
          <Link className="button button--primary" href="/admin">
            Abrir central ADM
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      <footer className="site-footer page-container">
        <span>Wonderland RPG</span>
        <small>Fundação v2 // Em reconstrução</small>
        <small>© 2026 Wonderland Ltda.</small>
      </footer>
    </main>
  );
}
