import { getThemeAvailability } from "@/lib/content/themes";
import { themeDefinitions } from "@/lib/content/theme-definitions";
import { saveThemesAction } from "./actions";

export const metadata = { title: "Temas | Painel ADM" };
export const dynamic = "force-dynamic";

export default async function AdminThemesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const [availability, query] = await Promise.all([getThemeAvailability(), searchParams]);
  return (
    <div className="admin-content admin-editor-page admin-themes-page">
      <header className="admin-page-title"><div><span className="eyebrow">Aparência de Wonderland</span><h2>Temas do site</h2><p>Escolha quais aparências podem ser usadas pelos jogadores. Administradores sempre conseguem visualizar todas.</p></div></header>
      {query.status ? <div className={`account-notice ${query.status === "erro" ? "is-warning" : ""}`}>{query.status === "salvo" ? "✓ Disponibilidade atualizada." : "! Não foi possível salvar."}</div> : null}
      <form action={saveThemesAction} className="admin-theme-grid">
        {themeDefinitions.map((theme) => (
          <label className={`admin-theme-card is-${theme.key}`} key={theme.key}>
            <span className="admin-theme-card__preview"><i>{theme.icon}</i></span>
            <span><strong>{theme.label}</strong><small>{theme.description}</small></span>
            <input name={theme.key} type="checkbox" defaultChecked={availability[theme.key]} disabled={theme.key === "classic"} />
            <b>{theme.key === "classic" ? "Tema-base" : "Disponível aos jogadores"}</b>
          </label>
        ))}
        <button className="button button--primary" type="submit">Salvar disponibilidade</button>
      </form>
    </div>
  );
}
