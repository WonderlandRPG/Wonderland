"use client";
/* eslint-disable react-hooks/set-state-in-effect -- AI action results intentionally hydrate the selected editor. */

import { useActionState, useEffect, useState, useTransition } from "react";
import {
  generateStudioContentWithAiAction,
  initialContentAiState,
  saveSimpleItemAction,
  saveSimpleTitleAction,
  type StudioContentKind,
} from "@/app/admin/estudio/content-actions";
import {
  effectKinds,
  itemSlots,
  rarities,
  simpleItemDefaults,
  simpleTitleDefaults,
  type ReworkItemAttributeDraft,
  type SimpleItemDraft,
  type SimpleTitleDraft,
} from "@/lib/admin/simple-content-builder";
import styles from "./admin-creation-studio.module.css";

const officialItemAttributes = ["FOR", "DEF", "RES", "INI", "INT", "HP"] as const;
const rarityLabels: Record<(typeof rarities)[number], string> = {
  common: "Comum",
  uncommon: "Incomum",
  rare: "Raro",
  epic: "Épico",
  legendary: "Lendário",
  mythic: "Mítico",
};
const slotLabels: Record<(typeof itemSlots)[number], string> = {
  head: "Cabeça",
  torso: "Torso",
  hands: "Mãos",
  legs: "Pernas",
  feet: "Pés",
  main_weapon: "Arma principal",
  off_weapon: "Arma secundária",
  necklace: "Colar",
  ring: "Anel",
  earring: "Brinco",
  cape: "Capa",
};
const effectLabels: Record<(typeof effectKinds)[number], string> = {
  "": "Sem efeito",
  POISON: "Envenenamento",
  BLEED: "Sangramento",
  LIFE_STEAL: "Roubo de vida",
  COOLDOWN_REDUCTION: "Redução de recarga",
  FREEZE: "Congelamento",
};

type Existing = {
  items: SimpleItemDraft[];
  titles: SimpleTitleDraft[];
};
export function AdminContentStudio({
  existing,
  aiConfigured,
}: {
  existing: Existing;
  aiConfigured: boolean;
}) {
  const [kind, setKind] = useState<StudioContentKind>("item");
  const [itemDraft, setItemDraft] = useState(simpleItemDefaults());
  const [titleDraft, setTitleDraft] = useState(simpleTitleDefaults());
  const [aiState, aiAction, aiPending] = useActionState(
    generateStudioContentWithAiAction,
    initialContentAiState,
  );
  const [saving, startSaving] = useTransition();
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (aiState.status !== "success" || !aiState.kind || !aiState.draft) return;
    setKind(aiState.kind);
    if (aiState.kind === "item") setItemDraft(aiState.draft as SimpleItemDraft);
    if (aiState.kind === "title") setTitleDraft(aiState.draft as SimpleTitleDraft);
  }, [aiState]);
  const currentList = kind === "item" ? existing.items : existing.titles;
  function newDraft() {
    setMessage("");
    if (kind === "item") setItemDraft(simpleItemDefaults());
    if (kind === "title") setTitleDraft(simpleTitleDefaults());
  }
  function loadExisting(id: string) {
    setMessage("");
    const list = currentList as Array<{ id?: string }>;
    const found = list.find((entry) => entry.id === id);
    if (!found) {
      newDraft();
      return;
    }
    if (kind === "item") setItemDraft(found as SimpleItemDraft);
    if (kind === "title") setTitleDraft(found as SimpleTitleDraft);
  }
  function save() {
    setMessage("");
    startSaving(async () => {
      const result = kind === "item"
        ? await saveSimpleItemAction(itemDraft)
        : await saveSimpleTitleAction(titleDraft);
      setMessage(result.message);
    });
  }
  const draftName = kind === "item" ? itemDraft.name : titleDraft.name;
  return (
    <section className={styles.builder}>
      <div className={styles.sectionHeading}>
        <div>
          <span>05</span>
          <h2>Central de conteúdo</h2>
        </div>
        <p>Crie ou edite sem abrir contratos técnicos.</p>
      </div>
      <div className={styles.contentTabs}>
        {(["item", "title"] as const).map((value) => (
          <button
            key={value}
            className={kind === value ? styles.activeTab : ""}
            onClick={() => {
              setKind(value);
              setMessage("");
            }}
            type="button"
          >
            {value === "item" ? "Item" : "Título"}
          </button>
        ))}
      </div>
      <div className={styles.contentToolbar}>
        <label>
          <span>Editar existente</span>
          <select
            value={(kind === "item" ? itemDraft : titleDraft).id || ""}
            onChange={(e) => loadExisting(e.target.value)}
          >
            <option value="">Criar novo</option>
            {currentList.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={newDraft}>
          ＋ Criar novo{" "}
          {kind === "item" ? "item" : "Título"}
        </button>
      </div>

      <div className={styles.aiSubPanel}>
        <div>
          <strong>✦ Pedir este conteúdo para a IA</strong>
          <small>A IA preenche o formulário; você revisa e só depois salva.</small>
        </div>
        <form action={aiAction} className={styles.aiContentForm}>
          <input name="kind" type="hidden" value={kind} />
          <textarea
            name="prompt"
            rows={3}
            required
            placeholder={`Ex.: Crie ${kind === "item" ? "uma espada lendária focada em FOR e sangramento" : "um título para fundadores"}.`}
          />
          <label>
            <span>Imagem opcional</span>
            <input accept="image/*" name="image" type="file" />
          </label>
          <button disabled={!aiConfigured || aiPending}>
            {aiPending ? "Gerando…" : "Gerar proposta"}
          </button>
        </form>
        {aiState.status !== "idle" ? (
          <p className={aiState.status === "error" ? styles.error : styles.success}>
            {aiState.message}
          </p>
        ) : null}
      </div>

      <div className={styles.editorLayout}>
        <div className={styles.formCard}>
          {kind === "item" ? <ItemForm value={itemDraft} onChange={setItemDraft} /> : null}
          {kind === "title" ? <TitleForm value={titleDraft} onChange={setTitleDraft} /> : null}
        </div>
        <aside className={styles.preview}>
          <span>PRÉVIA DO CONTEÚDO</span>
          <h3>{draftName}</h3>
          <p>{kind === "item" ? itemDraft.description : titleDraft.description}</p>
          <dl>
            <div>
              <dt>Tipo</dt>
              <dd>{kind === "item" ? rarityLabels[itemDraft.rarity] : "Título"}</dd>
            </div>
            {kind === "item" ? (
              <>
                <div>
                  <dt>Slot</dt>
                  <dd>{slotLabels[itemDraft.slot]}</dd>
                </div>
                <div>
                  <dt>Preço</dt>
                  <dd>{itemDraft.price} WG</dd>
                </div>
              </>
            ) : null}
            {kind === "title" ? (
              <div>
                <dt>Atributos</dt>
                <dd>{Object.values(titleDraft.attributes).reduce((a, b) => a + b, 0)} pts</dd>
              </div>
            ) : null}
          </dl>
          <div className={styles.valid}>
            ✓ Alterações avançadas não exibidas aqui são preservadas
          </div>
        </aside>
      </div>
      <div className={styles.contentSave}>
        <div>
          <strong>
            {(kind === "item" ? itemDraft : titleDraft).id
              ? "Salvar edição"
              : "Criar como novo conteúdo"}
          </strong>
          <small>Revise atributos e efeitos antes de salvar.</small>
        </div>
        <button disabled={saving} onClick={save} type="button">
          {saving ? "Salvando…" : "Confirmar e salvar"}
        </button>
        {message ? <p>{message}</p> : null}
      </div>
    </section>
  );
}

function ItemForm({
  value,
  onChange,
}: {
  value: SimpleItemDraft;
  onChange: (v: SimpleItemDraft) => void;
}) {
  return (
    <>
      <Text label="Nome" value={value.name} onChange={(name) => onChange({ ...value, name })} />
      <TextArea
        label="Descrição"
        value={value.description}
        onChange={(description) => onChange({ ...value, description })}
      />
      <div className={styles.grid}>
        <Text
          label="Categoria"
          value={value.category}
          onChange={(category) => onChange({ ...value, category })}
        />
        <Select
          label="Slot"
          value={value.slot}
          options={itemSlots.map((v) => [v, slotLabels[v]])}
          onChange={(v) => onChange({ ...value, slot: v as SimpleItemDraft["slot"] })}
        />
        <Select
          label="Raridade"
          value={value.rarity}
          options={rarities.map((v) => [v, rarityLabels[v]])}
          onChange={(v) => onChange({ ...value, rarity: v as SimpleItemDraft["rarity"] })}
        />
        <NumberField
          label="Preço WG"
          value={value.price}
          min={0}
          max={999999999}
          onChange={(price) => onChange({ ...value, price })}
        />
        <Text
          label="Imagem (URL)"
          value={value.imageUrl}
          onChange={(imageUrl) => onChange({ ...value, imageUrl })}
        />
        <label>
          <span>Arma de duas mãos?</span>
          <select
            value={value.twoHanded ? "yes" : "no"}
            onChange={(e) => onChange({ ...value, twoHanded: e.target.value === "yes" })}
          >
            <option value="no">Não</option>
            <option value="yes">Sim</option>
          </select>
        </label>
      </div>
      <ReworkItemAttributes
        label="Atributos concedidos"
        value={value.attributes}
        onChange={(attributes) => onChange({ ...value, attributes })}
      />
      <EffectFields value={value} onChange={onChange} />
    </>
  );
}
function TitleForm({
  value,
  onChange,
}: {
  value: SimpleTitleDraft;
  onChange: (v: SimpleTitleDraft) => void;
}) {
  return (
    <>
      <Text label="Nome" value={value.name} onChange={(name) => onChange({ ...value, name })} />
      <TextArea
        label="Descrição"
        value={value.description}
        onChange={(description) => onChange({ ...value, description })}
      />
      <ReworkItemAttributes
        label="Atributos concedidos"
        value={value.attributes}
        onChange={(attributes) => onChange({ ...value, attributes })}
      />
      <div className={styles.grid}>
        <Color
          label="Texto"
          value={value.primary}
          onChange={(primary) => onChange({ ...value, primary })}
        />
        <Color
          label="Fundo"
          value={value.secondary}
          onChange={(secondary) => onChange({ ...value, secondary })}
        />
        <Color
          label="Brilho"
          value={value.glow}
          onChange={(glow) => onChange({ ...value, glow })}
        />
      </div>
      <EffectFields value={value} onChange={onChange} />
    </>
  );
}
function EffectFields<T extends SimpleItemDraft | SimpleTitleDraft>({
  value,
  onChange,
}: {
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <>
      <div className={styles.grid}>
        <Select
          label="Efeito especial"
          value={value.effectKind}
          options={effectKinds.map((v) => [v, effectLabels[v]])}
          onChange={(v) => onChange({ ...value, effectKind: v as T["effectKind"] })}
        />
        <Text
          label="Nome do efeito"
          value={value.effectName}
          onChange={(effectName) => onChange({ ...value, effectName })}
        />
        <NumberField
          label="Potência"
          value={value.effectPower}
          min={0}
          max={1000}
          onChange={(effectPower) => onChange({ ...value, effectPower })}
        />
        <NumberField
          label="Duração"
          value={value.effectDuration}
          min={0}
          max={20}
          onChange={(effectDuration) => onChange({ ...value, effectDuration })}
        />
      </div>
      <TextArea
        label="Descrição do efeito"
        value={value.effectDescription}
        onChange={(effectDescription) => onChange({ ...value, effectDescription })}
      />
    </>
  );
}
function ReworkItemAttributes({
  label,
  value,
  onChange,
}: {
  label: string;
  value: ReworkItemAttributeDraft;
  onChange: (v: ReworkItemAttributeDraft) => void;
}) {
  return (
    <fieldset className={styles.attributeBox}>
      <legend>{label}</legend>
      <div className={styles.attributeGrid}>
        {officialItemAttributes.map((key) => (
          <NumberField
            key={key}
            label={key}
            value={value[key]}
            min={0}
            max={999}
            onChange={(n) => onChange({ ...value, [key]: n })}
          />
        ))}
      </div>
    </fieldset>
  );
}
function Text({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label>
      <span>{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className={styles.full}>
      <span>{label}</span>
      <textarea rows={4} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <label>
      <span>{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(globalThis.Number(e.target.value))}
      />
    </label>
  );
}
function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly (readonly [string, string])[];
  onChange: (v: string) => void;
}) {
  return (
    <label>
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}
function Color({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label>
      <span>{label}</span>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
