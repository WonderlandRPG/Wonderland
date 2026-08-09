import Link from "next/link";

import {
  duplicateClassAction,
  importOfficialClassesAction,
  restoreClassAction,
} from "@/app/admin/classes/actions";
import { getClassCatalog } from "@/lib/content/classes";

export const metadata = { title: "Gerenciar Classes" };
export const dynamic = "force-dynamic";

const filters = ["all", "published", "draft", "archived"] as const;
const labels = {
  all: "Todas",
  published: "Publicadas",
  draft: "Rascunhos",
  archived: "Arquivadas",
};
const statusLabels = { draft: "Rascunho", published: "Publicada", archived: "Arquivada" };
const notices: Record<string, { error?: boolean; message: string }> = {
  arquivada: { message: "A classe foi arquivada." },
  erro: { error: true, message: "Não foi possível concluir a operação." },
  "oficiais-importadas": { message: "As 13 classes oficiais foram sincronizadas e publicadas." },
  "nao-encontrada": { error: true, message: "A classe não foi encontrada." },
};

export default async function ClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; notice?: string }>;
}) {
  const query = await searchParams;
  const selected = filters.includes(query.status as (typeof filters)[number])
    ? (query.status as (typeof filters)[number])
    : "all";
  const classes = await getClassCatalog();
  const visible =
    selected === "all" ? classes : classes.filter((entry) => entry.status === selected);
  const counts = {
    all: classes.length,
    published: classes.filter((entry) => entry.status === "published").length,
    draft: classes.filter((entry) => entry.status === "draft").length,
    archived: classes.filter((entry) => entry.status === "archived").length,
  };
  const notice = query.notice ? notices[query.notice] : undefined;
  return (
    <div className="admin-content race-catalog-page">
      <section className="race-catalog-hero">
        <div>
          <span className="eyebrow">Conteúdo do jogo // módulo 02</span>
          <h1>Classes</h1>
          <p>
            Gerencie especializações, mecânicas, passivas, progressão e Caminhos lidos pela Arena.
          </p>
        </div>
        <div className="race-catalog-hero__actions">
          <form action={importOfficialClassesAction}>
            <button className="button button--dark" data-sfx="confirm" type="submit">
              Sincronizar 13 classes oficiais
            </button>
          </form>
          <Link className="button button--primary" href="/admin/classes/nova">
            Criar nova classe <span>＋</span>
          </Link>
        </div>
      </section>
      {notice ? (
        <div
          className={`admin-notice ${notice.error ? "admin-notice--error" : ""}`}
          data-sfx-on-mount={notice.error ? "error" : "confirm"}
          role={notice.error ? "alert" : "status"}
        >
          <span>{notice.error ? "!" : "✓"}</span>
          {notice.message}
        </div>
      ) : null}
      <section className="race-catalog-stats" aria-label="Resumo das classes">
        {filters.map((filter) => (
          <div key={filter}>
            <span>{labels[filter]}</span>
            <strong>{counts[filter]}</strong>
          </div>
        ))}
      </section>
      <nav className="race-catalog-filters" aria-label="Filtrar classes">
        {filters.map((filter) => (
          <Link
            className={selected === filter ? "is-active" : ""}
            href={filter === "all" ? "/admin/classes" : `/admin/classes?status=${filter}`}
            key={filter}
          >
            {labels[filter]}
            <span>{counts[filter]}</span>
          </Link>
        ))}
      </nav>
      {visible.length > 0 ? (
        <section className="race-catalog-grid">
          {visible.map((entry) => (
            <article className="race-catalog-card" key={entry.id}>
              <div
                className={`race-catalog-card__visual ${entry.payload.imageUrl ? "has-image" : ""}`}
                style={
                  entry.payload.imageUrl
                    ? { backgroundImage: `url("${entry.payload.imageUrl}")` }
                    : undefined
                }
              >
                <span>{entry.name.slice(0, 2).toUpperCase()}</span>
                <small>{"★".repeat(entry.payload.difficulty)}</small>
              </div>
              <div className="race-catalog-card__body">
                <div className="race-catalog-card__title">
                  <div>
                    <h2>{entry.name}</h2>
                    <code>{entry.slug}</code>
                  </div>
                  <span className={`content-status content-status--${entry.status}`}>
                    {statusLabels[entry.status]}
                  </span>
                </div>
                <p>{entry.payload.description}</p>
                <div className="race-catalog-card__metrics">
                  <span>
                    Tipo <strong>{entry.payload.specialization}</strong>
                  </span>
                  <span>
                    Habilidades <strong>{entry.payload.progression.length}</strong>
                  </span>
                  <span>
                    Caminhos <strong>{entry.payload.paths.length}</strong>
                  </span>
                  <span>
                    Rev. <strong>{entry.revision}</strong>
                  </span>
                </div>
              </div>
              <footer>
                <Link
                  className="race-card-action race-card-action--primary"
                  href={`/admin/classes/${entry.id}`}
                >
                  Editar
                </Link>
                <Link className="race-card-action" href={`/admin/classes/${entry.id}/preview`}>
                  Prévia
                </Link>
                <form action={duplicateClassAction.bind(null, entry.id)}>
                  <button className="race-card-action" type="submit">
                    Duplicar
                  </button>
                </form>
                {entry.status === "archived" ? (
                  <form action={restoreClassAction.bind(null, entry.id)}>
                    <button className="race-card-action" type="submit">
                      Restaurar
                    </button>
                  </form>
                ) : null}
              </footer>
            </article>
          ))}
        </section>
      ) : (
        <section className="race-catalog-empty">
          <span>CL</span>
          <h2>Nenhuma classe neste filtro</h2>
          <p>Sincronize o catálogo oficial ou crie uma classe.</p>
        </section>
      )}
    </div>
  );
}
