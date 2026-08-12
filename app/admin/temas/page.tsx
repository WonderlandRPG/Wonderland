import { getThemeConfiguration } from "@/lib/content/themes";
import { themeDefinitions } from "@/lib/content/theme-definitions";
import { saveThemesAction } from "./actions";

export const metadata = { title: "Temas | Painel ADM" };
export const dynamic = "force-dynamic";

export default async function AdminThemesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const [configuration, query] = await Promise.all([getThemeConfiguration(), searchParams]);
  return (
    <div className="admin-content admin-editor-page admin-themes-page">
      <header className="admin-page-title">
        <div>
          <span className="eyebrow">Aparência de Wonderland</span>
          <h2>Temas do site</h2>
          <p>
            Escolha quais aparências podem ser usadas pelos jogadores. Administradores sempre
            conseguem visualizar todas.
          </p>
        </div>
      </header>
      {query.status ? (
        <div className={`account-notice ${query.status === "erro" ? "is-warning" : ""}`}>
          {query.status === "salvo"
            ? "✓ Disponibilidade atualizada."
            : "! Não foi possível salvar."}
        </div>
      ) : null}
      <form action={saveThemesAction} className="admin-theme-grid">
        <section className="admin-theme-default">
          <span className="eyebrow">Entrada de Wonderland</span>
          <h3>Tema padrão do site</h3>
          <p>
            Será aplicado no primeiro acesso e sempre que a preferência salva do jogador estiver
            indisponível.
          </p>
        </section>
        {themeDefinitions.map((theme) => (
          <label className={`admin-theme-card is-${theme.key}`} key={theme.key}>
            <span className="admin-theme-card__preview">
              <i>{theme.icon}</i>
            </span>
            <span>
              <strong>{theme.label}</strong>
              <small>{theme.description}</small>
            </span>
            <input
              name={`available_${theme.key}`}
              type="checkbox"
              defaultChecked={configuration.availability[theme.key]}
            />
            <b>Disponível aos jogadores</b>
            <span className="admin-theme-default-choice">
              <input
                name="defaultTheme"
                type="radio"
                value={theme.key}
                defaultChecked={configuration.defaultTheme === theme.key}
              />{" "}
              Usar como padrão
            </span>
          </label>
        ))}
        <button className="button button--primary" type="submit">
          Salvar disponibilidade
        </button>
      </form>
    </div>
  );
}
