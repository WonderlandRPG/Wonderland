import type { RaceRevision } from "@/lib/content/races";

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  published: "Publicada",
  archived: "Arquivada",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

export function RaceHistory({
  currentRevision,
  updatedAt,
  revisions,
}: {
  currentRevision: number;
  updatedAt: string;
  revisions: RaceRevision[];
}) {
  return (
    <aside className="race-history">
      <div className="race-history__heading">
        <span className="eyebrow">Auditoria</span>
        <h2>Histórico</h2>
        <p>Cada alteração salva gera uma revisão automática e permanente.</p>
      </div>

      <ol className="race-history__timeline">
        <li className="is-current">
          <span />
          <div>
            <strong>Revisão {currentRevision}</strong>
            <small>Versão atual · {formatDate(updatedAt)}</small>
          </div>
        </li>
        {revisions.map((revision) => (
          <li key={revision.id}>
            <span />
            <div>
              <strong>Revisão {revision.revision}</strong>
              <small>
                {statusLabels[revision.snapshotStatus] ?? revision.snapshotStatus} ·{" "}
                {revision.editorName}
              </small>
              <small>{formatDate(revision.createdAt)}</small>
            </div>
          </li>
        ))}
      </ol>

      {revisions.length === 0 ? (
        <p className="race-history__empty">O histórico começará após a primeira alteração salva.</p>
      ) : null}
    </aside>
  );
}
