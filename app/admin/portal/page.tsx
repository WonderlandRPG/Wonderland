import { getPortalHeadline } from "@/lib/content/portal-settings";
import { restorePortalHeadlineAction, savePortalHeadlineAction } from "./actions";

export const metadata = { title: "Tela principal | Painel ADM" };
export const dynamic = "force-dynamic";

const messages: Record<string, string> = {
  salvo: "✓ Texto da tela principal atualizado.",
  invalido: "! Preencha as duas linhas usando no máximo 80 caracteres em cada uma.",
  erro: "! Não foi possível salvar a alteração.",
};

export default async function AdminPortalPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const [headline, query] = await Promise.all([getPortalHeadline(), searchParams]);

  return (
    <div className="admin-content admin-editor-page">
      <header className="admin-page-title">
        <div>
          <span className="eyebrow">Portal de entrada</span>
          <h2>Tela principal</h2>
          <p>Altere a chamada de lançamento exibida sobre o cenário inicial.</p>
        </div>
      </header>

      {query.status && messages[query.status] ? (
        <div className={`account-notice ${query.status !== "salvo" ? "is-warning" : ""}`}>
          {messages[query.status]}
        </div>
      ) : null}

      <section className="admin-portal-editor">
        <form action={savePortalHeadlineAction} className="admin-editor-card admin-form">
          <label className="form-field">
            Primeira linha
            <input defaultValue={headline.firstLine} maxLength={80} name="firstLine" required />
          </label>
          <label className="form-field">
            Segunda linha
            <input defaultValue={headline.secondLine} maxLength={80} name="secondLine" required />
          </label>
          <div className="admin-portal-editor__actions">
            <button className="button button--primary" type="submit">
              Salvar e publicar <span>→</span>
            </button>
            <button className="button button--glass" formAction={restorePortalHeadlineAction}>
              Restaurar texto padrão
            </button>
          </div>
        </form>

        <aside className="admin-portal-preview">
          <span className="eyebrow">Prévia</span>
          <strong>{headline.firstLine}</strong>
          <b>{headline.secondLine}</b>
          <small>A alteração aparece imediatamente na entrada do site.</small>
        </aside>
      </section>
    </div>
  );
}
