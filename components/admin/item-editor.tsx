"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { archiveItemAction, saveItemAction } from "@/app/admin/itens/actions";
import { initialItemActionState, type ItemEditorValue } from "@/lib/game/item-forms";
import { createItemSlug, equipmentSlotLabels, type EquipmentSlot } from "@/lib/game/items";
import { attributeKeys } from "@/lib/game/schemas";

const statuses = { draft: "Rascunho", published: "Publicado", archived: "Arquivado" };

export function ItemEditor({
  initialValue,
  notice,
}: {
  initialValue: ItemEditorValue;
  notice?: string;
}) {
  const [state, action, pending] = useActionState(saveItemAction, initialItemActionState);
  const [name, setName] = useState(initialValue.name);
  const [slug, setSlug] = useState(initialValue.slug);
  const [slugTouched, setSlugTouched] = useState(Boolean(initialValue.slug));
  const [payload, setPayload] = useState(initialValue.payload);
  return (
    <div className="race-editor-shell">
      <header className="race-editor-header">
        <div>
          <Link className="race-back-link" href="/admin/itens">
            ← Voltar aos itens
          </Link>
          <div className="race-editor-header__title">
            <h1>{initialValue.id ? name : "Criar item"}</h1>
            <span className={`content-status content-status--${initialValue.status}`}>
              {statuses[initialValue.status]}
            </span>
          </div>
          <p>Equipamentos publicados podem ser concedidos e usados nas fichas.</p>
        </div>
        {initialValue.id && initialValue.status !== "archived" ? (
          <form action={archiveItemAction.bind(null, initialValue.id)}>
            <button className="admin-action-button admin-action-button--danger" type="submit">
              Arquivar
            </button>
          </form>
        ) : null}
      </header>
      {notice ? (
        <div className="admin-notice" data-sfx-on-mount="confirm">
          <span>✓</span>Item {notice === "publicado" ? "publicado" : "salvo"} com sucesso.
        </div>
      ) : null}
      {state.status === "error" ? (
        <div className="admin-notice admin-notice--error" data-sfx-on-mount="error" role="alert">
          <span>!</span>
          {state.message}
        </div>
      ) : null}
      <form action={action} className="race-editor-form">
        <input name="id" type="hidden" value={initialValue.id} />
        <input name="expectedRevision" type="hidden" value={initialValue.revision} />
        <input name="payload" type="hidden" value={JSON.stringify(payload)} />
        <section className="race-editor-section">
          <header>
            <span>01</span>
            <div>
              <h2>Identidade do item</h2>
              <p>Nome, descrição, categoria e raridade.</p>
            </div>
          </header>
          <div className="race-editor-section__body">
            <div className="race-form-grid race-form-grid--two">
              <Field label="Nome">
                <input
                  name="name"
                  required
                  value={name}
                  onChange={(event) => {
                    const value = event.target.value;
                    setName(value);
                    if (!slugTouched) setSlug(createItemSlug(value));
                  }}
                />
              </Field>
              <Field label="Identificador">
                <input
                  name="slug"
                  required
                  value={slug}
                  onChange={(event) => {
                    setSlugTouched(true);
                    setSlug(createItemSlug(event.target.value));
                  }}
                />
              </Field>
            </div>
            <Field label="Descrição">
              <textarea
                required
                rows={6}
                value={payload.description}
                onChange={(event) =>
                  setPayload((current) => ({ ...current, description: event.target.value }))
                }
              />
            </Field>
            <div className="race-form-grid race-form-grid--two">
              <Field label="Imagem">
                <input
                  type="url"
                  value={payload.imageUrl}
                  onChange={(event) =>
                    setPayload((current) => ({ ...current, imageUrl: event.target.value }))
                  }
                />
              </Field>
              <Field label="Categoria">
                <input
                  required
                  value={payload.category}
                  onChange={(event) =>
                    setPayload((current) => ({ ...current, category: event.target.value }))
                  }
                />
              </Field>
              <Field label="Raridade">
                <input
                  required
                  value={payload.rarity}
                  onChange={(event) =>
                    setPayload((current) => ({ ...current, rarity: event.target.value }))
                  }
                />
              </Field>
              <Field label="Preço em WG">
                <input
                  min={0}
                  type="number"
                  value={payload.priceWg}
                  onChange={(event) =>
                    setPayload((current) => ({ ...current, priceWg: Number(event.target.value) }))
                  }
                />
              </Field>
            </div>
          </div>
        </section>
        <section className="race-editor-section">
          <header>
            <span>02</span>
            <div>
              <h2>Uso e equipamento</h2>
              <p>Nível, espaço equipado e regras de empilhamento.</p>
            </div>
          </header>
          <div className="race-editor-section__body">
            <div className="race-form-grid race-form-grid--two">
              <Field label="Nível necessário">
                <input
                  min={1}
                  type="number"
                  value={payload.levelRequirement}
                  onChange={(event) =>
                    setPayload((current) => ({
                      ...current,
                      levelRequirement: Number(event.target.value),
                    }))
                  }
                />
              </Field>
              <Field label="Espaço de equipamento">
                <select
                  value={payload.equipmentSlot ?? ""}
                  onChange={(event) =>
                    setPayload((current) => ({
                      ...current,
                      equipmentSlot: (event.target.value || null) as EquipmentSlot | null,
                    }))
                  }
                >
                  <option value="">Não equipável</option>
                  {Object.entries(equipmentSlotLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Empilhável">
                <select
                  value={payload.stackable ? "sim" : "nao"}
                  onChange={(event) =>
                    setPayload((current) => ({
                      ...current,
                      stackable: event.target.value === "sim",
                      maxStack: event.target.value === "sim" ? Math.max(2, current.maxStack) : 1,
                    }))
                  }
                >
                  <option value="nao">Não</option>
                  <option value="sim">Sim</option>
                </select>
              </Field>
              <Field label="Limite da pilha">
                <input
                  disabled={!payload.stackable}
                  min={1}
                  max={999}
                  type="number"
                  value={payload.maxStack}
                  onChange={(event) =>
                    setPayload((current) => ({ ...current, maxStack: Number(event.target.value) }))
                  }
                />
              </Field>
            </div>
          </div>
        </section>
        <section className="race-editor-section">
          <header>
            <span>03</span>
            <div>
              <h2>Bônus e efeitos</h2>
              <p>Os bônus equipados entram imediatamente nos cálculos da ficha.</p>
            </div>
          </header>
          <div className="race-editor-section__body">
            <div className="race-attributes-editor">
              {attributeKeys.map((attribute) => (
                <label key={attribute}>
                  <span>{attribute}</span>
                  <small>Bônus</small>
                  <input
                    min={0}
                    type="number"
                    value={payload.attributeBonuses[attribute] ?? 0}
                    onChange={(event) =>
                      setPayload((current) => ({
                        ...current,
                        attributeBonuses: {
                          ...current.attributeBonuses,
                          [attribute]: Number(event.target.value),
                        },
                      }))
                    }
                  />
                </label>
              ))}
            </div>
            <div className="item-effect-editor">
              <div>
                <strong>Efeitos adicionais</strong>
                <button
                  className="admin-add-button"
                  type="button"
                  onClick={() =>
                    setPayload((current) => ({ ...current, effects: [...current.effects, ""] }))
                  }
                >
                  ＋ Adicionar efeito
                </button>
              </div>
              {payload.effects.map((effect, index) => (
                <div key={index}>
                  <textarea
                    rows={3}
                    value={effect}
                    onChange={(event) =>
                      setPayload((current) => ({
                        ...current,
                        effects: current.effects.map((entry, entryIndex) =>
                          entryIndex === index ? event.target.value : entry,
                        ),
                      }))
                    }
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setPayload((current) => ({
                        ...current,
                        effects: current.effects.filter((_, entryIndex) => entryIndex !== index),
                      }))
                    }
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
        <footer className="race-editor-submit">
          <div>
            <span className="is-valid">✓ Validação de inventário ativa</span>
            <small>Itens publicados ficam disponíveis para concessão.</small>
          </div>
          <div>
            <button
              className="button button--dark"
              disabled={pending}
              name="intent"
              type="submit"
              value="save"
            >
              Salvar
            </button>
            {initialValue.status !== "published" ? (
              <button
                className="button button--primary"
                disabled={pending}
                name="intent"
                type="submit"
                value="publish"
              >
                Publicar item
              </button>
            ) : null}
          </div>
        </footer>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="race-field">
      <span>{label}</span>
      {children}
    </label>
  );
}
