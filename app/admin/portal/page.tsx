import { getPortalHeadline } from "@/lib/content/portal-settings";
import { PortalHeadlineEditor } from "@/components/admin/portal-headline-editor";

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

      <PortalHeadlineEditor initial={headline} />
    </div>
  );
}
