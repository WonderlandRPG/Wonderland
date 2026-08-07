import Link from "next/link";

import { getAdminOverview } from "@/lib/content/overview";

export const metadata = {
  title: "Central de Comando",
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const overview = await getAdminOverview();

  return (
    <div className="admin-content">
      <section className="command-hero">
        <div className="command-hero__copy">
          <span className="eyebrow">Core administrativo // v2.1</span>
          <h2>Uma central para governar todo o Wonderland.</h2>
          <p>
            O primeiro editor está ativo. Raças, bônus, passivas e progressão agora podem ser
            administrados sem alterar o código do site.
          </p>
          <div className="command-hero__actions">
            <Link className="button button--primary" href="/admin/racas/nova">
              Criar raça
              <span aria-hidden="true">＋</span>
            </Link>
            <Link className="button button--dark" href="/admin/racas">
              Gerenciar raças
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
          {overview.modules.map((module, index) => {
            const enabled = module.key === "race";

            return (
              <article
                className={`admin-module-card ${enabled ? "is-enabled" : ""}`}
                key={module.key}
              >
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
                  {enabled ? (
                    <Link aria-label={`Abrir módulo ${module.label}`} href="/admin/racas">
                      →
                    </Link>
                  ) : (
                    <button type="button" disabled aria-label={`Abrir módulo ${module.label}`}>
                      →
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="admin-setup">
        <div className="admin-setup__index">LIVE</div>
        <div>
          <span className="eyebrow">Primeiro módulo</span>
          <h2>Gerenciamento de raças ativado.</h2>
          <p>
            Crie, publique, duplique e arquive raças. O histórico registra cada alteração e o limite
            racial de 25 pontos é protegido pelo servidor.
          </p>
        </div>
        <span className="admin-setup__status">Editor disponível</span>
      </section>
    </div>
  );
}
