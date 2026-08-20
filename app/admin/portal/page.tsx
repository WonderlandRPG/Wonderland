import { getPortalHeadline } from "@/lib/content/portal-settings";
import { PortalHeadlineEditor } from "@/components/admin/portal-headline-editor";

export const metadata = { title: "Tela principal | Painel ADM" };
export const dynamic = "force-dynamic";

const messages: Record<string, string> = {
  salvo: "✓ Textos da tela principal atualizados.",
  invalido: "! Preencha o texto da temporada e as duas linhas da chamada respeitando os limites de caracteres.",
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
          <p>Altere o texto da temporada e a chamada principal exibidos sobre o cenário inicial.</p>
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
