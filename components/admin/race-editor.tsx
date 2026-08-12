"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import {
  archiveRaceAction,
  duplicateRaceAction,
  saveRaceAction,
  restoreRaceAction,
} from "@/app/admin/racas/actions";
import { RacePreview } from "@/components/admin/race-preview";
import { StructuredSkillEditor } from "@/components/admin/structured-skill-editor";
import type { ClassSkill } from "@/lib/game/classes";
import { initialRaceActionState, type RaceEditorValue } from "@/lib/game/race-forms";
import {
  attributeLabels,
  createRaceSlug,
  getRaceBonusTotal,
  maximumRaceBonusPoints,
  type RaceMechanic,
} from "@/lib/game/races";
import { attributeKeys, classSkillSchema } from "@/lib/game/schemas";

const statusLabels = {
  draft: "Rascunho",
  published: "Publicada",
  archived: "Arquivada",
};

const noticeMessages: Record<string, string> = {
  salva: "Todas as alterações foram salvas.",
  publicada: "A raça foi publicada e já está disponível para os sistemas do jogo.",
  duplicada: "A cópia foi criada como rascunho. Revise o nome antes de publicá-la.",
  restaurada: "A raça foi restaurada como rascunho.",
};

export function RaceEditor({
  initialValue,
  notice,
}: {
  initialValue: RaceEditorValue;
  notice?: string;
}) {
  const [state, formAction, pending] = useActionState(saveRaceAction, initialRaceActionState);
  const [name, setName] = useState(initialValue.name);
  const [slug, setSlug] = useState(initialValue.slug);
  const [slugTouched, setSlugTouched] = useState(Boolean(initialValue.slug));
  const [payload, setPayload] = useState(initialValue.payload);
  const [showPreview, setShowPreview] = useState(false);
  const bonusTotal = getRaceBonusTotal(payload.attributeBonuses);
  const bonusIsValid = bonusTotal <= maximumRaceBonusPoints;
  const isNew = !initialValue.id;

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(createRaceSlug(value));
  }

  function updateMechanic(index: number, field: keyof RaceMechanic, value: string) {
    setPayload((current) => ({
      ...current,
      mechanics: current.mechanics.map((mechanic, mechanicIndex) =>
        mechanicIndex === index ? { ...mechanic, [field]: value } : mechanic,
      ),
    }));
  }

  const structuredAbilities = classSkillSchema.array().safeParse(payload.abilitiesV2);
  const abilities: ClassSkill[] = structuredAbilities.success ? structuredAbilities.data : [];
  const structuredTraits = classSkillSchema.array().safeParse(payload.traitsV2);
  const traits: ClassSkill[] = structuredTraits.success ? structuredTraits.data : [];

  const publishedSave = initialValue.status === "published";
  const saveLabel = publishedSave
    ? "Salvar alterações publicadas"
    : initialValue.status === "archived"
      ? "Restaurar como rascunho"
      : "Salvar rascunho";

  return (
    <div className="race-editor-shell">
      <header className="race-editor-header">
        <div>
          <Link className="race-back-link" href="/admin/racas">
            ← Voltar ao catálogo
          </Link>
          <div className="race-editor-header__title">
            <h1>{isNew ? "Criar nova raça" : name || "Raça sem nome"}</h1>
            <span className={`content-status content-status--${initialValue.status}`}>
              {statusLabels[initialValue.status]}
            </span>
          </div>
          <p>
            {isNew
              ? "Preencha a identidade, os bônus e a progressão racial."
              : `Revisão ${initialValue.revision} · Identificador ${initialValue.slug}`}
          </p>
        </div>

        <div className="race-editor-header__actions">
          <button
            className="admin-action-button"
            type="button"
            onClick={() => setShowPreview(true)}
          >
            Visualizar prévia
          </button>
          {!isNew ? (
            <form action={duplicateRaceAction.bind(null, initialValue.id)}>
              <button className="admin-action-button" type="submit">
                Duplicar
              </button>
            </form>
          ) : null}
          {!isNew && initialValue.status !== "archived" ? (
            <form
              action={archiveRaceAction.bind(null, initialValue.id)}
              onSubmit={(event) => {
                if (
                  !window.confirm("Arquivar esta raça? Ela deixará de aparecer como publicada.")
                ) {
                  event.preventDefault();
                }
              }}
            >
              <button className="admin-action-button admin-action-button--danger" type="submit">
                Arquivar
              </button>
            </form>
          ) : null}
          {!isNew && initialValue.status === "archived" ? (
            <form action={restoreRaceAction.bind(null, initialValue.id)}>
              <button className="admin-action-button" type="submit">
                Restaurar
              </button>
            </form>
          ) : null}
        </div>
      </header>

      {notice && noticeMessages[notice] ? (
        <div className="admin-notice" role="status">
          <span>✓</span>
          {noticeMessages[notice]}
        </div>
      ) : null}

      {state.status === "error" ? (
        <div className="admin-notice admin-notice--error" role="alert">
          <span>!</span>
          {state.message}
        </div>
      ) : null}

      <form action={formAction} className="race-editor-form">
        <input name="id" type="hidden" value={initialValue.id} />
        <input name="expectedRevision" type="hidden" value={initialValue.revision} />
        <input name="payload" type="hidden" value={JSON.stringify(payload)} />

        <EditorSection
          description="Nome, descrição, dificuldade e imagem de apresentação."
          index="01"
          title="Identidade da raça"
        >
          <div className="race-form-grid race-form-grid--two">
            <EditorField error={state.fieldErrors?.name?.[0]} label="Nome da raça">
              <input
                aria-invalid={Boolean(state.fieldErrors?.name)}
                maxLength={80}
                name="name"
                onChange={(event) => handleNameChange(event.target.value)}
                placeholder="Ex.: Aengel"
                required
                value={name}
              />
            </EditorField>
            <EditorField
              error={state.fieldErrors?.slug?.[0]}
              hint="Usado internamente nos endereços e integrações."
              label="Identificador"
            >
              <input
                aria-invalid={Boolean(state.fieldErrors?.slug)}
                maxLength={80}
                name="slug"
                onChange={(event) => {
                  setSlugTouched(true);
                  setSlug(createRaceSlug(event.target.value));
                }}
                placeholder="aengel"
                required
                value={slug}
              />
            </EditorField>
          </div>

          <EditorField label="Descrição">
            <textarea
              onChange={(event) =>
                setPayload((current) => ({ ...current, description: event.target.value }))
              }
              placeholder="Origem, aparência, cultura, papel no mundo e estilo da raça..."
              required
              rows={8}
              value={payload.description}
            />
          </EditorField>

          <div className="race-form-grid race-form-grid--two">
            <EditorField hint="Aceita um endereço HTTPS de imagem." label="Imagem da raça">
              <input
                onChange={(event) =>
                  setPayload((current) => ({ ...current, imageUrl: event.target.value }))
                }
                placeholder="https://.../aengel.png"
                type="url"
                value={payload.imageUrl}
              />
            </EditorField>
            <EditorField label="Dificuldade">
              <select
                onChange={(event) =>
                  setPayload((current) => ({
                    ...current,
                    difficulty: Number(event.target.value),
                  }))
                }
                value={payload.difficulty}
              >
                {[1, 2, 3, 4, 5].map((difficulty) => (
                  <option key={difficulty} value={difficulty}>
                    {"★".repeat(difficulty)}
                    {"☆".repeat(5 - difficulty)} — {difficulty}/5
                  </option>
                ))}
              </select>
            </EditorField>
          </div>
        </EditorSection>

        <EditorSection
          description="Valores iniciais recebidos por todo personagem desta raça."
          index="02"
          title="Vida, Mana e atributos"
        >
          <div className="race-vitals-editor">
            <EditorField label="HP inicial">
              <input
                min={0}
                onChange={(event) =>
                  setPayload((current) => ({ ...current, baseHp: Number(event.target.value) }))
                }
                required
                type="number"
                value={payload.baseHp}
              />
            </EditorField>
            <EditorField label="Mana inicial">
              <input
                min={0}
                onChange={(event) =>
                  setPayload((current) => ({ ...current, baseMana: Number(event.target.value) }))
                }
                required
                type="number"
                value={payload.baseMana}
              />
            </EditorField>
            <div className={`race-points-meter ${bonusIsValid ? "is-valid" : "is-invalid"}`}>
              <span>Pontos raciais usados</span>
              <strong>
                {bonusTotal}
                <small>/{maximumRaceBonusPoints}</small>
              </strong>
              <div>
                <span
                  style={{
                    width: `${Math.min(100, (bonusTotal / maximumRaceBonusPoints) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="race-attributes-editor">
            {attributeKeys.map((attribute) => (
              <label key={attribute}>
                <span>{attribute}</span>
                <small>{attributeLabels[attribute]}</small>
                <input
                  aria-label={`Bônus de ${attributeLabels[attribute]}`}
                  min={0}
                  onChange={(event) =>
                    setPayload((current) => ({
                      ...current,
                      attributeBonuses: {
                        ...current.attributeBonuses,
                        [attribute]: Number(event.target.value),
                      },
                    }))
                  }
                  required
                  type="number"
                  value={payload.attributeBonuses[attribute]}
                />
              </label>
            ))}
          </div>

          {!bonusIsValid ? (
            <p className="race-limit-error" role="alert">
              Reduza {bonusTotal - maximumRaceBonusPoints} ponto(s) para respeitar o limite racial.
            </p>
          ) : null}
        </EditorSection>

        <EditorSection
          action={
            <button
              className="admin-add-button"
              onClick={() =>
                setPayload((current) => ({
                  ...current,
                  mechanics: [...current.mechanics, { name: "", description: "" }],
                }))
              }
              type="button"
            >
              ＋ Adicionar mecânica
            </button>
          }
          description="O sistema exclusivo que define como a raça gera, acumula e utiliza seu recurso."
          index="03"
          title="Mecânica racial"
        >
          <DynamicCollection empty="Nenhuma mecânica racial adicionada.">
            {payload.mechanics.map((mechanic, index) => (
              <DynamicCard
                index={index}
                key={`mechanic-${index}`}
                label="Mecânica"
                onRemove={() =>
                  setPayload((current) => ({
                    ...current,
                    mechanics: current.mechanics.filter(
                      (_, mechanicIndex) => mechanicIndex !== index,
                    ),
                  }))
                }
              >
                <EditorField label="Nome da mecânica">
                  <input
                    onChange={(event) => updateMechanic(index, "name", event.target.value)}
                    placeholder="Ex.: Radiância"
                    required
                    value={mechanic.name}
                  />
                </EditorField>
                <EditorField label="Descrição">
                  <textarea
                    onChange={(event) => updateMechanic(index, "description", event.target.value)}
                    placeholder="Explique como o recurso é obtido, seus limites, gastos e duração..."
                    required
                    rows={7}
                    value={mechanic.description}
                  />
                </EditorField>
              </DynamicCard>
            ))}
          </DynamicCollection>
        </EditorSection>

        <EditorSection
          description="Passivas permanentes com condições e operações legíveis pelo motor."
          index="04"
          title="Passivas raciais estruturadas"
        >
          {!structuredTraits.success && payload.traitsV2.length > 0 ? (
            <div className="admin-notice admin-notice--error">
              As passivas antigas precisam ser recriadas no contrato estruturado.
            </div>
          ) : null}
          <StructuredSkillEditor
            skills={traits}
            title="Passiva racial"
            onChange={(next) =>
              setPayload((current) => ({
                ...current,
                traitsV2: next,
                traits: next.map((skill) => ({
                  name: skill.name,
                  description: skill.playerDescription,
                })),
              }))
            }
          />
        </EditorSection>

        <EditorSection
          description="Habilidades raciais no contrato universal da Arena e das futuras dungeons."
          index="05"
          title="Habilidades estruturadas"
        >
          {!structuredAbilities.success && payload.abilitiesV2.length > 0 ? (
            <div className="admin-notice admin-notice--error" role="alert">
              As habilidades desta raça usam um formato antigo inválido. Recrie-as abaixo antes de
              salvar.
            </div>
          ) : null}
          <StructuredSkillEditor
            skills={abilities}
            title="Habilidade racial"
            onChange={(next) =>
              setPayload((current) => ({
                ...current,
                abilitiesV2: next,
                progression: next.map((skill) => ({
                  level: skill.level,
                  title: skill.name,
                  description: skill.playerDescription,
                })),
              }))
            }
          />
        </EditorSection>

        <footer className="race-editor-submit">
          <div>
            <span className={bonusIsValid ? "is-valid" : "is-invalid"}>
              {bonusIsValid ? "✓ Limite racial válido" : "! Limite racial excedido"}
            </span>
            <small>
              {publishedSave
                ? "Salvar modificará imediatamente a versão usada pelo jogo."
                : "O rascunho só será usado pelo jogo depois de publicado."}
            </small>
          </div>
          <div>
            <button
              className="button button--dark"
              disabled={pending || !bonusIsValid}
              name="intent"
              type="submit"
              value="save"
            >
              {pending ? "Salvando..." : saveLabel}
            </button>
            {!publishedSave ? (
              <button
                className="button button--primary"
                disabled={pending || !bonusIsValid}
                name="intent"
                type="submit"
                value="publish"
              >
                {pending ? "Publicando..." : "Publicar raça"}
              </button>
            ) : null}
          </div>
        </footer>
      </form>

      {showPreview ? (
        <div className="race-preview-modal" role="dialog" aria-label="Pré-visualização da raça">
          <button
            aria-label="Fechar pré-visualização"
            className="race-preview-modal__backdrop"
            onClick={() => setShowPreview(false)}
            type="button"
          />
          <div className="race-preview-modal__panel">
            <header>
              <div>
                <span>Prévia não publicada</span>
                <strong>{name || "Raça sem nome"}</strong>
              </div>
              <button onClick={() => setShowPreview(false)} type="button">
                Fechar ×
              </button>
            </header>
            <div>
              <RacePreview name={name} payload={payload} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function EditorSection({
  index,
  title,
  description,
  action,
  children,
}: {
  index: string;
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="race-editor-section">
      <header>
        <span>{index}</span>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        {action}
      </header>
      <div className="race-editor-section__body">{children}</div>
    </section>
  );
}

function EditorField({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="race-field">
      <span>{label}</span>
      {children}
      {error ? <small className="race-field__error">{error}</small> : null}
      {!error && hint ? <small>{hint}</small> : null}
    </label>
  );
}

function DynamicCollection({ empty, children }: { empty: string; children: React.ReactNode[] }) {
  return children.length > 0 ? (
    <div className="race-dynamic-list">{children}</div>
  ) : (
    <div className="race-dynamic-empty">
      <span>＋</span>
      <p>{empty}</p>
    </div>
  );
}

function DynamicCard({
  label,
  index,
  onRemove,
  children,
}: {
  label: string;
  index: number;
  onRemove(): void;
  children: React.ReactNode;
}) {
  return (
    <article className="race-dynamic-card">
      <header>
        <span>
          {label} {String(index + 1).padStart(2, "0")}
        </span>
        <button onClick={onRemove} type="button">
          Remover
        </button>
      </header>
      <div>{children}</div>
    </article>
  );
}
