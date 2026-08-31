import { attributesSchema } from "@/lib/game/schemas";
import { parseItemSpecialEffects } from "@/lib/game/item-effects";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { saveTitleAdminAction } from "./actions";
import type { ItemSpecialEffect } from "@/lib/game/item-effects";
import { DeleteTitleButton } from "@/components/admin/delete-title-button";
import { EquippedTitle } from "@/components/characters/equipped-title";
import { TitleAppearanceEditor } from "@/components/admin/title-appearance-editor";
import {
  defaultTitleStyle,
  parseTitleStyle,
  titleRarities,
  type TitleRarity,
  type TitleStyle,
} from "@/lib/game/title-style";

export const metadata = { title: "Títulos | Painel ADM" };
export const dynamic = "force-dynamic";

type TitleFormData = {
  id: string;
  name: string;
  description: string;
  attributes: Partial<Record<"FOR" | "DEF" | "RES" | "INI" | "INT" | "ARC", number>>;
  rarity: TitleRarity;
  style: TitleStyle;
  effect?: ItemSpecialEffect;
};

export default async function AdminTitlesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
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
          {query.status === "salvo"
            ? "✓ Título salvo."
            : query.status === "excluido"
              ? "✓ Título excluído de Wonderland e dos inventários."
              : "! Revise os dados do Título."}
        </div>
      ) : null}
      <section className="admin-title-create">
        <h3>Novo Título</h3>
        <TitleForm />
      </section>
      <section className="admin-editor-list">
        {(titles ?? []).map((title) => {
          const parsed = attributesSchema.safeParse(title.attributes);
          const style =
            title.title_style &&
            typeof title.title_style === "object" &&
            !Array.isArray(title.title_style)
              ? parseTitleStyle(title.title_style)
              : defaultTitleStyle;
          const effect = parseItemSpecialEffects(title.special_effects)[0];
          return (
            <details className="admin-editor-card" key={title.id}>
              <summary>
                <span>
                  <small>Título equipável</small>
                  <EquippedTitle
                    title={{ name: title.name, rarity: title.rarity, titleStyle: style }}
                  />
                </span>
                <b>Editar</b>
              </summary>
              <TitleForm
                title={{
                  ...title,
                  rarity: titleRarities.includes(title.rarity as TitleRarity)
                    ? (title.rarity as TitleRarity)
                    : "awakened",
                  attributes: parsed.success ? parsed.data : {},
                  style,
                  effect,
                }}
              />
              <div className="admin-title-delete">
                <p>A exclusão remove este Título de todos os inventários.</p>
                <DeleteTitleButton id={title.id} name={title.name} />
              </div>
            </details>
          );
        })}
      </section>
    </div>
  );
}

function TitleForm({ title }: { title?: TitleFormData }) {
  const style = title?.style ?? defaultTitleStyle;
  const effect = title?.effect;
  return (
    <form action={saveTitleAdminAction} className="admin-form admin-title-form">
      <input name="id" type="hidden" value={title?.id ?? ""} />
      <TitleAppearanceEditor
        name={title?.name ?? "Novo Título"}
        rarity={title?.rarity ?? "awakened"}
        initialStyle={style}
      />
      <label>
        <span>Nome</span>
        <input name="name" defaultValue={title?.name ?? ""} required />
      </label>
      <label className="is-wide">
        <span>Descrição</span>
        <textarea name="description" rows={3} defaultValue={title?.description ?? ""} required />
      </label>
      <fieldset className="title-identity-editor">
        <legend>Identidade e obtenção</legend>
        <label>
          <span>Categoria</span>
          <select name="titleCategory" defaultValue={style.category}>
            <option value="commemorative">Comemorativo</option>
            <option value="achievement">Conquista</option>
            <option value="competitive">Competitivo</option>
            <option value="exploration">Exploração</option>
            <option value="social">Social</option>
            <option value="legendary">Lendário</option>
            <option value="administrative">Administrativo</option>
          </select>
        </label>
        <label>
          <span>Raridade</span>
          <select name="rarity" defaultValue={title?.rarity ?? "awakened"}>
            <option value="common">Comum</option>
            <option value="uncommon">Incomum</option>
            <option value="rare">Raro</option>
            <option value="epic">Épico</option>
            <option value="legendary">Lendário</option>
            <option value="mythic">Mítico</option>
            <option value="awakened">Desperto</option>
          </select>
        </label>
        <label>
          <span>Disponibilidade</span>
          <select name="availability" defaultValue={style.availability}>
            <option value="permanent">Permanente</option>
            <option value="limited">Por tempo limitado</option>
            <option value="exclusive">Exclusivo / encerrado</option>
          </select>
        </label>
        <label className="is-wide">
          <span>Como é obtido</span>
          <input name="acquisition" defaultValue={style.acquisition} required />
        </label>
      </fieldset>
      <fieldset>
        <legend>Atributos</legend>
        {(["FOR", "DEF", "RES", "INI", "INT", "ARC"] as const).map((key) => (
          <label key={key}>
            <span>{key}</span>
            <input
              name={key}
              type="number"
              min="0"
              max="999"
              defaultValue={title?.attributes?.[key] ?? 0}
            />
          </label>
        ))}
      </fieldset>
      <fieldset>
        <legend>Efeito especial opcional</legend>
        <label>
          <span>Tipo</span>
          <select name="effectKind" defaultValue={effect?.kind ?? ""}>
            <option value="">Sem efeito</option>
            <option value="POISON">Envenenamento</option>
            <option value="BLEED">Sangramento</option>
            <option value="LIFE_STEAL">Roubo de vida</option>
            <option value="COOLDOWN_REDUCTION">Redução de recarga</option>
            <option value="FREEZE">Congelamento</option>
          </select>
        </label>
        <label>
          <span>Nome do efeito</span>
          <input name="effectName" defaultValue={effect?.name ?? ""} />
        </label>
        <label className="is-wide">
          <span>Descrição do efeito</span>
          <input name="effectDescription" defaultValue={effect?.description ?? ""} />
        </label>
        <label>
          <span>Potência</span>
          <input
            name="effectPower"
            type="number"
            min="0"
            max="1000"
            defaultValue={effect?.power ?? 0}
          />
        </label>
        <label>
          <span>Duração</span>
          <input
            name="effectDuration"
            type="number"
            min="0"
            max="20"
            defaultValue={effect?.duration ?? 0}
          />
        </label>
      </fieldset>
      <button className="button button--primary">{title ? "Salvar Título" : "Criar Título"}</button>
    </form>
  );
}
