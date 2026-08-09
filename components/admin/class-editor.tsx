"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import {
  archiveClassAction,
  duplicateClassAction,
  restoreClassAction,
  saveClassAction,
} from "@/app/admin/classes/actions";
import { ClassPreview } from "@/components/admin/class-preview";
import { initialClassActionState, type ClassEditorValue } from "@/lib/game/class-forms";
import {
  createClassSlug,
  createEmptyClassSkill,
  type ClassPath,
  type ClassSkill,
} from "@/lib/game/classes";
import { attributeKeys, type AttributeKey } from "@/lib/game/schemas";

const statusLabels = { draft: "Rascunho", published: "Publicada", archived: "Arquivada" };
const notices: Record<string, string> = {
  salva: "Todas as alterações foram salvas.",
  publicada: "A classe foi publicada e já alimenta as fichas e a Arena.",
  duplicada: "A cópia foi criada como rascunho.",
  restaurada: "A classe foi restaurada como rascunho.",
};

export function ClassEditor({
  initialValue,
  notice,
}: {
  initialValue: ClassEditorValue;
  notice?: string;
}) {
  const [state, action, pending] = useActionState(saveClassAction, initialClassActionState);
  const [name, setName] = useState(initialValue.name);
  const [slug, setSlug] = useState(initialValue.slug);
  const [slugTouched, setSlugTouched] = useState(Boolean(initialValue.slug));
  const [payload, setPayload] = useState(initialValue.payload);
  const [preview, setPreview] = useState(false);
  const isNew = !initialValue.id;

  function updateSkill(index: number, value: ClassSkill) {
    setPayload((current) => ({
      ...current,
      progression: current.progression.map((skill, skillIndex) =>
        skillIndex === index ? value : skill,
      ),
    }));
  }

  function updatePath(index: number, value: ClassPath) {
    setPayload((current) => ({
      ...current,
      paths: current.paths.map((path, pathIndex) => (pathIndex === index ? value : path)),
    }));
  }

  return (
    <div className="race-editor-shell">
      <header className="race-editor-header">
        <div>
          <Link className="race-back-link" href="/admin/classes">
            ← Voltar ao catálogo
          </Link>
          <div className="race-editor-header__title">
            <h1>{isNew ? "Criar nova classe" : name || "Classe sem nome"}</h1>
            <span className={`content-status content-status--${initialValue.status}`}>
              {statusLabels[initialValue.status]}
            </span>
          </div>
          <p>
            {isNew
              ? "Estruture a identidade e as regras interpretadas pela Arena."
              : `Revisão ${initialValue.revision} · ${initialValue.slug}`}
          </p>
        </div>
        <div className="race-editor-header__actions">
          <button
            className="admin-action-button"
            data-sfx="open"
            onClick={() => setPreview(true)}
            type="button"
          >
            Visualizar prévia
          </button>
          {!isNew ? (
            <form action={duplicateClassAction.bind(null, initialValue.id)}>
              <button className="admin-action-button" type="submit">
                Duplicar
              </button>
            </form>
          ) : null}
          {!isNew && initialValue.status !== "archived" ? (
            <form
              action={archiveClassAction.bind(null, initialValue.id)}
              onSubmit={(event) => {
                if (!window.confirm("Arquivar esta classe?")) event.preventDefault();
              }}
            >
              <button className="admin-action-button admin-action-button--danger" type="submit">
                Arquivar
              </button>
            </form>
          ) : null}
          {!isNew && initialValue.status === "archived" ? (
            <form action={restoreClassAction.bind(null, initialValue.id)}>
              <button className="admin-action-button" type="submit">
                Restaurar
              </button>
            </form>
          ) : null}
        </div>
      </header>

      {notice && notices[notice] ? (
        <div className="admin-notice" data-sfx-on-mount="confirm" role="status">
          <span>✓</span>
          {notices[notice]}
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

        <Section
          index="01"
          title="Identidade da classe"
          description="Apresentação, dificuldade, especialização e complexidade."
        >
          <div className="race-form-grid race-form-grid--two">
            <Field label="Nome">
              <input
                name="name"
                required
                value={name}
                onChange={(event) => {
                  const value = event.target.value;
                  setName(value);
                  if (!slugTouched) setSlug(createClassSlug(value));
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
                  setSlug(createClassSlug(event.target.value));
                }}
              />
            </Field>
          </div>
          <Field label="Descrição">
            <textarea
              required
              rows={7}
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
            <Field label="Dificuldade">
              <select
                value={payload.difficulty}
                onChange={(event) =>
                  setPayload((current) => ({ ...current, difficulty: Number(event.target.value) }))
                }
              >
                {[1, 2, 3, 4, 5].map((value) => (
                  <option key={value} value={value}>
                    {"★".repeat(value)}
                    {"☆".repeat(5 - value)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Complexidade">
              <input
                required
                value={payload.complexity}
                onChange={(event) =>
                  setPayload((current) => ({ ...current, complexity: event.target.value }))
                }
              />
            </Field>
            <Field label="Especialização">
              <input
                required
                value={payload.specialization}
                onChange={(event) =>
                  setPayload((current) => ({ ...current, specialization: event.target.value }))
                }
              />
            </Field>
          </div>
        </Section>

        <Section
          index="02"
          title="Afinidades de atributos"
          description="Estrelas de afinidade e atributos centrais da classe."
        >
          <div className="race-attributes-editor class-affinity-editor">
            {attributeKeys.map((attribute) => (
              <label key={attribute}>
                <span>{attribute}</span>
                <small>
                  {payload.primaryAttributes.includes(attribute) ? "Central" : "Afinidade"}
                </small>
                <select
                  aria-label={`Afinidade ${attribute}`}
                  value={payload.affinities[attribute]}
                  onChange={(event) =>
                    setPayload((current) => ({
                      ...current,
                      affinities: {
                        ...current.affinities,
                        [attribute]: Number(event.target.value),
                      },
                    }))
                  }
                >
                  {[1, 2, 3, 4, 5].map((value) => (
                    <option key={value} value={value}>
                      {value} ★
                    </option>
                  ))}
                </select>
                <input
                  aria-label={`${attribute} é atributo central`}
                  checked={payload.primaryAttributes.includes(attribute)}
                  type="checkbox"
                  onChange={(event) =>
                    setPayload((current) => ({
                      ...current,
                      primaryAttributes: toggleAttribute(
                        current.primaryAttributes,
                        attribute,
                        event.target.checked,
                      ),
                    }))
                  }
                />
              </label>
            ))}
          </div>
        </Section>

        <Section
          index="03"
          title="Mecânica e passiva"
          description="Recurso exclusivo e efeito permanente da classe."
        >
          <div className="race-dynamic-list">
            <article className="race-dynamic-card">
              <header>
                <span>Mecânica exclusiva</span>
              </header>
              <div>
                <Field label="Nome">
                  <input
                    required
                    value={payload.mechanic.name}
                    onChange={(event) =>
                      setPayload((current) => ({
                        ...current,
                        mechanic: { ...current.mechanic, name: event.target.value },
                      }))
                    }
                  />
                </Field>
                <Field label="Descrição">
                  <textarea
                    required
                    rows={6}
                    value={payload.mechanic.description}
                    onChange={(event) =>
                      setPayload((current) => ({
                        ...current,
                        mechanic: { ...current.mechanic, description: event.target.value },
                      }))
                    }
                  />
                </Field>
              </div>
            </article>
            <article className="race-dynamic-card">
              <header>
                <span>Passiva da classe</span>
              </header>
              <div>
                <Field label="Nome">
                  <input
                    required
                    value={payload.passive.name}
                    onChange={(event) =>
                      setPayload((current) => ({
                        ...current,
                        passive: { ...current.passive, name: event.target.value },
                      }))
                    }
                  />
                </Field>
                <Field label="Descrição">
                  <textarea
                    required
                    rows={6}
                    value={payload.passive.description}
                    onChange={(event) =>
                      setPayload((current) => ({
                        ...current,
                        passive: { ...current.passive, description: event.target.value },
                      }))
                    }
                  />
                </Field>
              </div>
            </article>
          </div>
        </Section>

        <Section
          index="04"
          title="Progressão de habilidades"
          description="Habilidades desbloqueadas por nível, com campos lidos pelo motor de combate."
          action={
            <button
              className="admin-add-button"
              type="button"
              onClick={() =>
                setPayload((current) => ({
                  ...current,
                  progression: [...current.progression, createEmptyClassSkill()],
                }))
              }
            >
              ＋ Adicionar habilidade
            </button>
          }
        >
          <Collection empty="Nenhuma habilidade cadastrada.">
            {payload.progression.map((skill, index) => (
              <SkillCard
                key={`${skill.key}-${index}`}
                index={index}
                skill={skill}
                onChange={(value) => updateSkill(index, value)}
                onRemove={() =>
                  setPayload((current) => ({
                    ...current,
                    progression: current.progression.filter(
                      (_, skillIndex) => skillIndex !== index,
                    ),
                  }))
                }
              />
            ))}
          </Collection>
        </Section>

        <Section
          index="05"
          title="Caminhos da classe"
          description="Especializações desbloqueadas no nível 50."
          action={
            <button
              className="admin-add-button"
              type="button"
              onClick={() =>
                setPayload((current) => ({
                  ...current,
                  paths: [...current.paths, emptyPath(current.paths.length)],
                }))
              }
            >
              ＋ Adicionar Caminho
            </button>
          }
        >
          <Collection empty="Nenhum Caminho cadastrado.">
            {payload.paths.map((path, index) => (
              <article className="race-dynamic-card class-path-card" key={`${path.key}-${index}`}>
                <header>
                  <span>Caminho {String(index + 1).padStart(2, "0")}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setPayload((current) => ({
                        ...current,
                        paths: current.paths.filter((_, pathIndex) => pathIndex !== index),
                      }))
                    }
                  >
                    Remover
                  </button>
                </header>
                <div>
                  <div className="race-form-grid race-form-grid--two">
                    <Field label="Nome">
                      <input
                        required
                        value={path.name}
                        onChange={(event) =>
                          updatePath(index, {
                            ...path,
                            name: event.target.value,
                            key: createClassSlug(event.target.value) || path.key,
                          })
                        }
                      />
                    </Field>
                    <Field label="Identificador">
                      <input
                        required
                        value={path.key}
                        onChange={(event) =>
                          updatePath(index, { ...path, key: createClassSlug(event.target.value) })
                        }
                      />
                    </Field>
                  </div>
                  <Field label="Descrição">
                    <textarea
                      required
                      rows={4}
                      value={path.description}
                      onChange={(event) =>
                        updatePath(index, { ...path, description: event.target.value })
                      }
                    />
                  </Field>
                  <div className="race-form-grid race-form-grid--two">
                    <Field label="Nova passiva">
                      <input
                        required
                        value={path.passive.name}
                        onChange={(event) =>
                          updatePath(index, {
                            ...path,
                            passive: { ...path.passive, name: event.target.value },
                          })
                        }
                      />
                    </Field>
                    <Field label="Descrição da passiva">
                      <textarea
                        required
                        rows={4}
                        value={path.passive.description}
                        onChange={(event) =>
                          updatePath(index, {
                            ...path,
                            passive: { ...path.passive, description: event.target.value },
                          })
                        }
                      />
                    </Field>
                  </div>
                  <button
                    className="admin-add-button"
                    type="button"
                    onClick={() =>
                      updatePath(index, {
                        ...path,
                        skills: [...path.skills, createEmptyClassSkill(50)],
                      })
                    }
                  >
                    ＋ Adicionar habilidade ao Caminho
                  </button>
                  <div className="race-dynamic-list class-path-skills">
                    {path.skills.map((skill, skillIndex) => (
                      <SkillCard
                        key={`${skill.key}-${skillIndex}`}
                        index={skillIndex}
                        skill={skill}
                        compact
                        onChange={(value) =>
                          updatePath(index, {
                            ...path,
                            skills: path.skills.map((entry, entryIndex) =>
                              entryIndex === skillIndex ? value : entry,
                            ),
                          })
                        }
                        onRemove={() =>
                          updatePath(index, {
                            ...path,
                            skills: path.skills.filter(
                              (_, entryIndex) => entryIndex !== skillIndex,
                            ),
                          })
                        }
                      />
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </Collection>
        </Section>

        <footer className="race-editor-submit">
          <div>
            <span className="is-valid">✓ Estrutura validada no servidor</span>
            <small>Alterações publicadas atualizam fichas, Grimório e Arena.</small>
          </div>
          <div>
            <button
              className="button button--dark"
              disabled={pending}
              name="intent"
              type="submit"
              value="save"
            >
              {pending ? "Salvando..." : "Salvar"}
            </button>
            {initialValue.status !== "published" ? (
              <button
                className="button button--primary"
                disabled={pending}
                name="intent"
                type="submit"
                value="publish"
              >
                Publicar classe
              </button>
            ) : null}
          </div>
        </footer>
      </form>

      {preview ? (
        <div className="race-preview-modal" role="dialog" aria-label="Prévia da classe">
          <button
            className="race-preview-modal__backdrop"
            data-sfx="close"
            onClick={() => setPreview(false)}
            type="button"
          />
          <div className="race-preview-modal__panel">
            <header>
              <div>
                <span>Prévia não publicada</span>
                <strong>{name || "Classe sem nome"}</strong>
              </div>
              <button data-sfx="close" onClick={() => setPreview(false)} type="button">
                Fechar ×
              </button>
            </header>
            <div>
              <ClassPreview name={name} payload={payload} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SkillCard({
  skill,
  index,
  compact = false,
  onChange,
  onRemove,
}: {
  skill: ClassSkill;
  index: number;
  compact?: boolean;
  onChange(value: ClassSkill): void;
  onRemove(): void;
}) {
  const update = <Key extends keyof ClassSkill>(key: Key, value: ClassSkill[Key]) =>
    onChange({ ...skill, [key]: value });
  return (
    <article className="race-dynamic-card class-skill-card">
      <header>
        <span>
          {compact ? "Habilidade do Caminho" : "Habilidade"} {String(index + 1).padStart(2, "0")}
        </span>
        <button type="button" onClick={onRemove}>
          Remover
        </button>
      </header>
      <div>
        <div className="race-form-grid race-form-grid--two">
          <Field label="Nome">
            <input
              required
              value={skill.name}
              onChange={(event) =>
                onChange({
                  ...skill,
                  name: event.target.value,
                  key: createClassSlug(event.target.value) || skill.key,
                })
              }
            />
          </Field>
          <Field label="Categoria">
            <input
              required
              value={skill.category}
              onChange={(event) => update("category", event.target.value)}
            />
          </Field>
        </div>
        <div className="class-skill-numbers">
          <Field label="Nível">
            <input
              min={1}
              type="number"
              value={skill.level}
              onChange={(event) => update("level", Number(event.target.value))}
            />
          </Field>
          <Field label="Custo">
            <input
              min={0}
              type="number"
              value={skill.cost}
              onChange={(event) => update("cost", Number(event.target.value))}
            />
          </Field>
          <Field label="Recarga">
            <input
              min={0}
              type="number"
              value={skill.cooldown}
              onChange={(event) => update("cooldown", Number(event.target.value))}
            />
          </Field>
          <Field label="Alcance">
            <input
              min={0}
              type="number"
              value={skill.range}
              onChange={(event) => update("range", Number(event.target.value))}
            />
          </Field>
          <Field label="Área">
            <input
              min={0}
              type="number"
              value={skill.area}
              onChange={(event) => update("area", Number(event.target.value))}
            />
          </Field>
          <Field label="Duração">
            <input
              min={0}
              type="number"
              value={skill.duration}
              onChange={(event) => update("duration", Number(event.target.value))}
            />
          </Field>
        </div>
        <div className="class-skill-selects">
          <Field label="Função">
            <select
              value={skill.kind}
              onChange={(event) => update("kind", event.target.value as ClassSkill["kind"])}
            >
              <option value="damage">Dano</option>
              <option value="heal">Cura</option>
              <option value="shield">Escudo</option>
              <option value="utility">Utilidade</option>
            </select>
          </Field>
          <Field label="Dano">
            <select
              value={skill.damageType}
              onChange={(event) =>
                update("damageType", event.target.value as ClassSkill["damageType"])
              }
            >
              <option value="none">Nenhum</option>
              <option value="physical">Físico</option>
              <option value="magic">Mágico</option>
              <option value="true">Verdadeiro</option>
            </select>
          </Field>
          <Field label="Alvo">
            <select
              value={skill.target}
              onChange={(event) => update("target", event.target.value as ClassSkill["target"])}
            >
              <option value="enemy">Inimigo</option>
              <option value="self">Usuário</option>
              <option value="ally">Aliado</option>
              <option value="area">Área</option>
            </select>
          </Field>
          <Field label="Recurso">
            <select
              value={skill.resource}
              onChange={(event) => update("resource", event.target.value as ClassSkill["resource"])}
            >
              <option value="none">Nenhum</option>
              <option value="mana">Mana</option>
              <option value="life">HP</option>
              <option value="special">Especial</option>
            </select>
          </Field>
        </div>
        <Field label="Efeito">
          <textarea
            required
            rows={5}
            value={skill.effect}
            onChange={(event) => update("effect", event.target.value)}
          />
        </Field>
        <div className="class-scaling-editor">
          <span>Escalas de cálculo</span>
          {skill.scaling.map((scaling, scalingIndex) => (
            <div key={`${scaling.attribute}-${scalingIndex}`}>
              <select
                value={scaling.attribute}
                onChange={(event) =>
                  update(
                    "scaling",
                    skill.scaling.map((entry, entryIndex) =>
                      entryIndex === scalingIndex
                        ? { ...entry, attribute: event.target.value as AttributeKey }
                        : entry,
                    ),
                  )
                }
              >
                {attributeKeys.map((attribute) => (
                  <option key={attribute}>{attribute}</option>
                ))}
              </select>
              <input
                min={0}
                step="0.01"
                type="number"
                value={scaling.multiplier}
                onChange={(event) =>
                  update(
                    "scaling",
                    skill.scaling.map((entry, entryIndex) =>
                      entryIndex === scalingIndex
                        ? { ...entry, multiplier: Number(event.target.value) }
                        : entry,
                    ),
                  )
                }
              />
              <b>x</b>
              <button
                type="button"
                onClick={() =>
                  update(
                    "scaling",
                    skill.scaling.filter((_, entryIndex) => entryIndex !== scalingIndex),
                  )
                }
              >
                Remover
              </button>
            </div>
          ))}
          <button
            className="admin-add-button"
            type="button"
            onClick={() =>
              update("scaling", [...skill.scaling, { attribute: "FOR", multiplier: 1 }])
            }
          >
            ＋ Adicionar escala
          </button>
        </div>
      </div>
    </article>
  );
}

function emptyPath(index: number): ClassPath {
  return {
    key: `novo-caminho-${index + 1}`,
    name: `Novo Caminho ${index + 1}`,
    description: "Descreva a identidade deste Caminho.",
    passive: { name: "Nova passiva", description: "Descreva a passiva." },
    skills: [],
  };
}
function toggleAttribute(current: AttributeKey[], attribute: AttributeKey, checked: boolean) {
  if (checked) return current.includes(attribute) ? current : [...current, attribute];
  const next = current.filter((entry) => entry !== attribute);
  return next.length > 0 ? next : current;
}
function Section({
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
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="race-field">
      <span>{label}</span>
      {children}
    </label>
  );
}
function Collection({ empty, children }: { empty: string; children: React.ReactNode[] }) {
  return children.length > 0 ? (
    <div className="race-dynamic-list">{children}</div>
  ) : (
    <div className="race-dynamic-empty">
      <span>＋</span>
      <p>{empty}</p>
    </div>
  );
}
