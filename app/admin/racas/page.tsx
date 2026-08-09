import Link from "next/link";

import {
  duplicateRaceAction,
  importOfficialRacesAction,
  restoreRaceAction,
} from "@/app/admin/racas/actions";
import { getRaceCatalog } from "@/lib/content/races";
import { getRaceBonusTotal } from "@/lib/game/races";

export const metadata = {
  title: "Gerenciar Raças",
};

export const dynamic = "force-dynamic";

const filters = [
  { key: "all", label: "Todas" },
  { key: "published", label: "Publicadas" },
  { key: "draft", label: "Rascunhos" },
  { key: "archived", label: "Arquivadas" },
] as const;

const statusLabels = {
  draft: "Rascunho",
  published: "Publicada",
  archived: "Arquivada",
};

const notices: Record<string, { kind: "success" | "error"; message: string }> = {
  arquivada: { kind: "success", message: "A raça foi arquivada e saiu do conteúdo publicado." },
  erro: { kind: "error", message: "Não foi possível concluir a operação. Tente novamente." },
  "oficiais-importadas": {
    kind: "success",
    message: "As 11 raças oficiais foram sincronizadas e publicadas com sucesso.",
  },
  "nao-encontrada": { kind: "error", message: "A raça selecionada não foi encontrada." },
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

export default async function RacesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; notice?: string }>;
}) {
  const query = await searchParams;
  const selectedStatus = filters.some((filter) => filter.key === query.status)
    ? query.status
    : "all";
  const races = await getRaceCatalog();
  const visibleRaces =
    selectedStatus === "all" ? races : races.filter((race) => race.status === selectedStatus);
  const notice = query.notice ? notices[query.notice] : undefined;

  const counts = {
    all: races.length,
    published: races.filter((race) => race.status === "published").length,
    draft: races.filter((race) => race.status === "draft").length,
    archived: races.filter((race) => race.status === "archived").length,
  };

  return (
    <div className="admin-content race-catalog-page">
      <section className="race-catalog-hero">
        <div>
          <span className="eyebrow">Conteúdo do jogo // módulo 01</span>
          <h1>Raças</h1>
          <p>
            Gerencie identidade, bônus, mecânica, passivas e habilidades por nível sem alterar o
            código.
          </p>
        </div>
        <div className="race-catalog-hero__actions">
          <form action={importOfficialRacesAction}>
            <button className="button button--dark" type="submit">
              Sincronizar 11 raças oficiais
            </button>
          </form>
          <Link className="button button--primary" href="/admin/racas/nova">
            Criar nova raça <span>＋</span>
          </Link>
        </div>
      </section>

      {notice ? (
        <div
          className={`admin-notice ${notice.kind === "error" ? "admin-notice--error" : ""}`}
          role={notice.kind === "error" ? "alert" : "status"}
        >
          <span>{notice.kind === "error" ? "!" : "✓"}</span>
          {notice.message}
        </div>
      ) : null}

      <section className="race-catalog-stats" aria-label="Resumo das raças">
        <div>
          <span>Total</span>
          <strong>{counts.all}</strong>
        </div>
        <div>
          <span>Publicadas</span>
          <strong>{counts.published}</strong>
        </div>
        <div>
          <span>Rascunhos</span>
          <strong>{counts.draft}</strong>
        </div>
        <div>
          <span>Arquivadas</span>
          <strong>{counts.archived}</strong>
        </div>
      </section>

      <nav className="race-catalog-filters" aria-label="Filtrar raças por status">
        {filters.map((filter) => (
          <Link
            className={selectedStatus === filter.key ? "is-active" : ""}
            href={filter.key === "all" ? "/admin/racas" : `/admin/racas?status=${filter.key}`}
            key={filter.key}
          >
            {filter.label}
            <span>{counts[filter.key]}</span>
          </Link>
        ))}
      </nav>

      {visibleRaces.length > 0 ? (
        <section className="race-catalog-grid">
          {visibleRaces.map((race) => (
            <article className="race-catalog-card" key={race.id}>
              <div
                className={`race-catalog-card__visual ${race.payload.imageUrl ? "has-image" : ""}`}
                style={
                  race.payload.imageUrl
                    ? { backgroundImage: `url("${race.payload.imageUrl}")` }
                    : undefined
                }
              >
                <span>{race.name.slice(0, 2).toUpperCase()}</span>
                <small>{"★".repeat(race.payload.difficulty)}</small>
              </div>
              <div className="race-catalog-card__body">
                <div className="race-catalog-card__title">
                  <div>
                    <h2>{race.name}</h2>
                    <code>{race.slug}</code>
                  </div>
                  <span className={`content-status content-status--${race.status}`}>
                    {statusLabels[race.status]}
                  </span>
                </div>
                <p>{race.payload.description}</p>
                <div className="race-catalog-card__metrics">
                  <span>
                    HP <strong>{race.payload.baseHp}</strong>
                  </span>
                  <span>
                    Mana <strong>{race.payload.baseMana}</strong>
                  </span>
                  <span>
                    Pontos <strong>{getRaceBonusTotal(race.payload.attributeBonuses)}/25</strong>
                  </span>
                  <span>
                    Rev. <strong>{race.revision}</strong>
                  </span>
                </div>
                <small className="race-catalog-card__updated">
                  Atualizada em {formatDate(race.updated_at)}
                </small>
              </div>
              <footer>
                <Link
                  className="race-card-action race-card-action--primary"
                  href={`/admin/racas/${race.id}`}
                >
                  Editar
                </Link>
                <Link className="race-card-action" href={`/admin/racas/${race.id}/preview`}>
                  Prévia
                </Link>
                <form action={duplicateRaceAction.bind(null, race.id)}>
                  <button className="race-card-action" type="submit">
                    Duplicar
                  </button>
                </form>
                {race.status === "archived" ? (
                  <form action={restoreRaceAction.bind(null, race.id)}>
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
          <span>RA</span>
          <h2>{races.length === 0 ? "Nenhuma raça cadastrada" : "Nenhuma raça neste filtro"}</h2>
          <p>
            {races.length === 0
              ? "Crie a primeira raça do Wonderland para iniciar o catálogo administrável."
              : "Escolha outro status para visualizar o restante do catálogo."}
          </p>
          {races.length === 0 ? (
            <Link className="button button--primary" href="/admin/racas/nova">
              Criar primeira raça
            </Link>
          ) : null}
        </section>
      )}
    </div>
  );
}
