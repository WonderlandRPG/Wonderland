import { attributesSchema } from "@/lib/game/schemas";
import { parseItemSpecialEffects } from "@/lib/game/item-effects";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { saveTitleAdminAction } from "./actions";
import type { ItemSpecialEffect } from "@/lib/game/item-effects";

export const metadata = { title: "Títulos | Painel ADM" };
export const dynamic = "force-dynamic";

const defaults = { primary: "#fff1b5", secondary: "#1f7a4c", glow: "#d7ad45" };
type TitleFormData = {
  id: string;
  name: string;
  description: string;
  attributes: Partial<Record<"FOR" | "DEF" | "RES" | "INI" | "INT" | "ARC", number>>;
  style: { primary?: unknown; secondary?: unknown; glow?: unknown };
  effect?: ItemSpecialEffect;
};

export default async function AdminTitlesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const client = await createServerSupabaseClient();
  const [{ data: titles }, query] = await Promise.all([
    client
      ? client.from("v2_shop_items").select("*").eq("slot", "title").order("name")
      : Promise.resolve({ data: [] }),
    searchParams,
  ]);
  return (
    <div className="admin-content admin-editor-page admin-titles-page">
      <header className="admin-page-title">
        <div>
          <span className="eyebrow">Honrarias de Wonderland</span>
          <h2>Editar Títulos</h2>
          <p>Crie e ajuste nome, descrição, cores, atributos e efeitos dos Títulos equipáveis.</p>
        </div>
      </header>
      {query.status ? (
        <div className={`account-notice ${query.status === "erro" ? "is-warning" : ""}`}>
          {query.status === "salvo" ? "✓ Título salvo." : "! Revise os dados do Título."}
        </div>
      ) : null}
      <section className="admin-title-create">
        <h3>Novo Título</h3>
        <TitleForm />
      </section>
      <section className="admin-editor-list">
        {(titles ?? []).map((title) => {
          const parsed = attributesSchema.safeParse(title.attributes);
          const style = title.title_style && typeof title.title_style === "object" && !Array.isArray(title.title_style)
            ? title.title_style
            : defaults;
          const effect = parseItemSpecialEffects(title.special_effects)[0];
          return (
            <details className="admin-editor-card" key={title.id}>
              <summary>
                <span><small>Título equipável</small><strong>✦ {title.name}</strong></span>
                <b>Editar</b>
              </summary>
              <TitleForm title={{ ...title, attributes: parsed.success ? parsed.data : {}, style, effect }} />
            </details>
          );
        })}
      </section>
    </div>
  );
}

function TitleForm({ title }: { title?: TitleFormData }) {
  const style = title?.style ?? defaults;
  const effect = title?.effect;
  return (
    <form action={saveTitleAdminAction} className="admin-form admin-title-form">
      <input name="id" type="hidden" value={title?.id ?? ""} />
      <label><span>Nome</span><input name="name" defaultValue={title?.name ?? ""} required /></label>
      <label className="is-wide"><span>Descrição</span><textarea name="description" rows={3} defaultValue={title?.description ?? ""} required /></label>
      <fieldset className="title-color-editor"><legend>Cores do Título</legend>
        <label><span>Texto</span><input name="primary" type="color" defaultValue={String(style.primary ?? defaults.primary)} /></label>
        <label><span>Fundo</span><input name="secondary" type="color" defaultValue={String(style.secondary ?? defaults.secondary)} /></label>
        <label><span>Brilho</span><input name="glow" type="color" defaultValue={String(style.glow ?? defaults.glow)} /></label>
      </fieldset>
      <fieldset><legend>Atributos</legend>{(["FOR", "DEF", "RES", "INI", "INT", "ARC"] as const).map((key) => (
        <label key={key}><span>{key}</span><input name={key} type="number" min="0" max="999" defaultValue={title?.attributes?.[key] ?? 0} /></label>
      ))}</fieldset>
      <fieldset><legend>Efeito especial opcional</legend>
        <label><span>Tipo</span><select name="effectKind" defaultValue={effect?.kind ?? ""}><option value="">Sem efeito</option><option value="POISON">Envenenamento</option><option value="BLEED">Sangramento</option><option value="LIFE_STEAL">Roubo de vida</option><option value="COOLDOWN_REDUCTION">Redução de recarga</option><option value="FREEZE">Congelamento</option></select></label>
        <label><span>Nome do efeito</span><input name="effectName" defaultValue={effect?.name ?? ""} /></label>
        <label className="is-wide"><span>Descrição do efeito</span><input name="effectDescription" defaultValue={effect?.description ?? ""} /></label>
        <label><span>Potência</span><input name="effectPower" type="number" min="0" max="1000" defaultValue={effect?.power ?? 0} /></label>
        <label><span>Duração</span><input name="effectDuration" type="number" min="0" max="20" defaultValue={effect?.duration ?? 0} /></label>
      </fieldset>
      <button className="button button--primary">{title ? "Salvar Título" : "Criar Título"}</button>
    </form>
  );
}
