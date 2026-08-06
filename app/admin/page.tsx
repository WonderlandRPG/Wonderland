import Link from "next/link";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { getAdminOverview } from "@/lib/content/overview";

export const metadata = {
  title: "Central de Comando",
};

export default async function AdminPage() {
  const overview = await getAdminOverview();

  return (
    <main className="admin-shell">
      <AdminSidebar />

      <section className="admin-workspace">
        <header className="admin-topbar">
          <div>
            <span className="admin-topbar__path">Wonderland / Administração / Núcleo</span>
            <h1>Central de comando</h1>
          </div>
          <div className="admin-topbar__actions">
            <span
              className={`connection-status ${overview.configured ? "is-online" : "is-pending"}`}
            >
              <span className="signal-dot" />
              {overview.configured ? "Supabase conectado" : "Supabase aguardando conexão"}
            </span>
            <button className="admin-profile" type="button" disabled>
              <span>CH</span>
              <span>
                <strong>Fundador</strong>
                <small>Configuração inicial</small>
              </span>
            </button>
          </div>
        </header>

        <div className="admin-content">
          <section className="command-hero">
            <div className="command-hero__copy">
              <span className="eyebrow">Core administrativo // v2.0</span>
              <h2>Uma central para governar todo o Wonderland.</h2>
              <p>
                A fundação já separa conteúdo, regras e histórico. Os editores serão ativados módulo
                por módulo, todos usando o mesmo sistema seguro.
              </p>
              <div className="command-hero__actions">
                <button className="button button--primary" type="button" disabled>
                  Criar conteúdo
                  <span aria-hidden="true">＋</span>
                </button>
                <Link className="button button--dark" href="/">
                  Visualizar portal
                </Link>
              </div>
            </div>
            <div className="command-hero__radar" aria-hidden="true">
              <div className="radar-ring radar-ring--one" />
              <div className="radar-ring radar-ring--two" />
              <div className="radar-ring radar-ring--three" />
              <span className="radar-core">W</span>
              <span className="radar-ping radar-ping--one" />
              <span className="radar-ping radar-ping--two" />
              <span className="radar-ping radar-ping--three" />
            </div>
          </section>

          <section className="admin-metrics" aria-label="Resumo do painel">
            <article>
              <span>Módulos mapeados</span>
              <strong>{String(overview.totals.modules).padStart(2, "0")}</strong>
              <small>Estrutura central definida</small>
            </article>
            <article>
              <span>Conteúdos publicados</span>
              <strong>{String(overview.totals.published).padStart(2, "0")}</strong>
              <small>Sincronizados com o jogo</small>
            </article>
            <article>
              <span>Rascunhos</span>
              <strong>{String(overview.totals.drafts).padStart(2, "0")}</strong>
              <small>Aguardando publicação</small>
            </article>
            <article className="admin-metrics__health">
              <span>Integridade do núcleo</span>
              <strong>100%</strong>
              <small>Validação TypeScript ativa</small>
            </article>
          </section>

          <section className="admin-section">
            <div className="admin-section__heading">
              <div>
                <span className="eyebrow">Catálogo central</span>
                <h2>Sistemas administráveis</h2>
              </div>
              <span className="admin-section__meta">{overview.totals.modules} módulos</span>
            </div>

            <div className="admin-module-grid">
              {overview.modules.map((module, index) => (
                <article className="admin-module-card" key={module.key}>
                  <div className="admin-module-card__head">
                    <span className="admin-module-card__glyph">{module.glyph}</span>
                    <span className="admin-module-card__number">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3>{module.label}</h3>
                  <p>{module.description}</p>
                  <div className="admin-module-card__footer">
                    <span>{module.published} publicados</span>
                    <span>{module.drafts} rascunhos</span>
                    <button type="button" disabled aria-label={`Abrir módulo ${module.label}`}>
                      →
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="admin-setup">
            <div className="admin-setup__index">NEXT</div>
            <div>
              <span className="eyebrow">Próxima etapa</span>
              <h2>Conectar autenticação e permissões.</h2>
              <p>
                Aplicaremos a migração v2 no Supabase, definiremos os fundadores e ativaremos o
                primeiro editor real do painel.
              </p>
            </div>
            <span className="admin-setup__status">Aguardando configuração</span>
          </section>
        </div>
      </section>
    </main>
  );
}
