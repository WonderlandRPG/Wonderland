"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { initialClassActionState, saveClassAction } from "@/app/admin/classes/actions";
import { StructuredSkillEditor } from "@/components/admin/structured-skill-editor";
import { createClassSlug, createEmptyClassSkill, type ClassPayload } from "@/lib/game/classes";
import { attributeKeys } from "@/lib/game/schemas";

type Value = {
  id: string;
  name: string;
  slug: string;
  revision: number;
  status: "draft" | "published" | "archived";
  payload: ClassPayload;
};
export function ClassEditor({ initialValue, notice }: { initialValue: Value; notice?: string }) {
  const [state, action, pending] = useActionState(saveClassAction, initialClassActionState);
  const [name, setName] = useState(initialValue.name);
  const [slug, setSlug] = useState(initialValue.slug);
  const [payload, setPayload] = useState(initialValue.payload);
  const published = initialValue.status === "published";
  return (
    <div className="race-editor-shell">
      <header className="race-editor-header">
        <div>
          <Link className="race-back-link" href="/admin/classes">
            ← Voltar às classes
          </Link>
          <div className="race-editor-header__title">
            <h1>{name || "Nova classe"}</h1>
            <span className={`content-status content-status--${initialValue.status}`}>
              {initialValue.status === "published" ? "Publicada" : "Rascunho"}
            </span>
          </div>
          <p>Contrato estruturado usado pela Arena e pelas dungeons.</p>
        </div>
      </header>
      {notice ? (
        <div className="admin-notice">
          ✓ Classe {notice === "publicada" ? "publicada" : "salva"}.
        </div>
      ) : null}
      {state.status === "error" ? (
        <div className="admin-notice admin-notice--error">
          <strong>!</strong> {state.message}
          {state.fieldErrors?.payload ? (
            <ul>
              {state.fieldErrors.payload.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      <form action={action} className="race-editor-form">
        <input name="id" type="hidden" value={initialValue.id} />
        <input name="expectedRevision" type="hidden" value={initialValue.revision} />
        <input name="payload" type="hidden" value={JSON.stringify(payload)} />
        <Section
          index="01"
          title="Identidade da classe"
          description="Informações lidas pelos jogadores antes da escolha."
        >
          <div className="race-form-grid race-form-grid--two">
            <Field label="Nome">
              <input
                name="name"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setSlug(createClassSlug(e.target.value));
                }}
              />
            </Field>
            <Field label="Identificador">
              <input
                name="slug"
                required
                value={slug}
                onChange={(e) => setSlug(createClassSlug(e.target.value))}
              />
            </Field>
          </div>
          <Field label="Descrição">
            <textarea
              rows={6}
              value={payload.description}
              onChange={(e) => setPayload({ ...payload, description: e.target.value })}
            />
          </Field>
          <div className="structured-skill__grid structured-skill__grid--4">
            <Field label="Especialização">
              <input
                value={payload.specialization}
                onChange={(e) => setPayload({ ...payload, specialization: e.target.value })}
              />
            </Field>
            <Field label="Complexidade">
              <input
                value={payload.complexity}
                onChange={(e) => setPayload({ ...payload, complexity: e.target.value })}
              />
            </Field>
            <Field label="Dificuldade">
              <select
                value={payload.difficulty}
                onChange={(e) => setPayload({ ...payload, difficulty: Number(e.target.value) })}
              >
                {[1, 2, 3, 4, 5].map((value) => (
                  <option key={value} value={value}>
                    {"★".repeat(value)}
                    {"☆".repeat(5 - value)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Imagem">
              <input
                type="url"
                value={payload.imageUrl}
                onChange={(e) => setPayload({ ...payload, imageUrl: e.target.value })}
              />
            </Field>
          </div>
          <div className="race-attributes-editor">
            {attributeKeys.map((attribute) => (
              <label key={attribute}>
                <span>{attribute}</span>
                <small>Afinidade 1–5</small>
                <input
                  min={1}
                  max={5}
                  type="number"
                  value={payload.affinities[attribute]}
                  onChange={(e) =>
                    setPayload({
                      ...payload,
                      affinities: { ...payload.affinities, [attribute]: Number(e.target.value) },
                    })
                  }
                />
              </label>
            ))}
          </div>
        </Section>
        <Section
          index="02"
          title="Recurso e passiva"
          description="Geração, consumo e reinício precisam ser determinísticos."
        >
          <div className="race-form-grid race-form-grid--two">
            <Field label="Nome do recurso">
              <input
                value={payload.resource.name}
                onChange={(e) =>
                  setPayload({
                    ...payload,
                    resource: { ...payload.resource, name: e.target.value },
                  })
                }
              />
            </Field>
            <Field label="Valor inicial">
              <input
                min={0}
                type="number"
                value={payload.resource.initial}
                onChange={(e) =>
                  setPayload({
                    ...payload,
                    resource: { ...payload.resource, initial: Number(e.target.value) },
                  })
                }
              />
            </Field>
            <Field label="Valor máximo">
              <input
                min={1}
                type="number"
                value={payload.resource.maximum}
                onChange={(e) =>
                  setPayload({
                    ...payload,
                    resource: { ...payload.resource, maximum: Number(e.target.value) },
                  })
                }
              />
            </Field>
            <Field label="Nome da mecânica">
              <input
                value={payload.mechanic.name}
                onChange={(e) =>
                  setPayload({
                    ...payload,
                    mechanic: { ...payload.mechanic, name: e.target.value },
                  })
                }
              />
            </Field>
          </div>
          <Field label="Regra da mecânica">
            <textarea
              rows={4}
              value={payload.mechanic.description}
              onChange={(e) =>
                setPayload({
                  ...payload,
                  mechanic: { ...payload.mechanic, description: e.target.value },
                })
              }
            />
          </Field>
          <div className="structured-skill__grid structured-skill__grid--4">
            <Lines
              label="Regras de geração"
              value={payload.resource.generationRules}
              onChange={(generationRules) =>
                setPayload({ ...payload, resource: { ...payload.resource, generationRules } })
              }
            />
            <Lines
              label="Regras de consumo"
              value={payload.resource.consumptionRules}
              onChange={(consumptionRules) =>
                setPayload({ ...payload, resource: { ...payload.resource, consumptionRules } })
              }
            />
            <Lines
              label="Regras de reinício"
              value={payload.resource.resetRules}
              onChange={(resetRules) =>
                setPayload({ ...payload, resource: { ...payload.resource, resetRules } })
              }
            />
          </div>
          <div className="race-form-grid race-form-grid--two">
            <Field label="Nome da passiva">
              <input
                value={payload.passive.name}
                onChange={(e) =>
                  setPayload({ ...payload, passive: { ...payload.passive, name: e.target.value } })
                }
              />
            </Field>
            <Field label="Regra da passiva">
              <textarea
                rows={4}
                value={payload.passive.description}
                onChange={(e) =>
                  setPayload({
                    ...payload,
                    passive: { ...payload.passive, description: e.target.value },
                  })
                }
              />
            </Field>
          </div>
        </Section>
        <Section
          index="03"
          title="Progressão da classe"
          description="Habilidades universais da classe, estruturadas para o motor."
        >
          <StructuredSkillEditor
            skills={payload.progression}
            onChange={(progression) => setPayload({ ...payload, progression })}
            title="Habilidade de classe"
          />
        </Section>
        <Section
          index="04"
          title="Caminhos da classe"
          description="Cada caminho concede passiva e habilidades extras."
        >
          <button
            className="admin-add-button"
            type="button"
            onClick={() =>
              setPayload({
                ...payload,
                paths: [
                  ...payload.paths,
                  {
                    key: `novo-caminho-${payload.paths.length + 1}`,
                    name: "Novo caminho",
                    description: "Descreva o caminho.",
                    unlockLevel: 50,
                    quest: {
                      title: "A Escolha do Novo Caminho",
                      briefing: "Procure o mentor deste caminho ao alcançar o nível 50.",
                      objectives: [
                        "Converse com o mentor no Salão dos Caminhos.",
                        "Complete três confrontos de treino usando a doutrina do caminho.",
                        "Retorne ao mentor e confirme sua escolha.",
                      ],
                      completionText: "O caminho e sua primeira habilidade foram desbloqueados.",
                    },
                    passive: { name: "Passiva do caminho", description: "Descreva a passiva." },
                    skills: [50, 60, 70, 80, 90, 100].map((level) => createEmptyClassSkill(level)),
                  },
                ],
              })
            }
          >
            ＋ Adicionar caminho
          </button>
          {payload.paths.map((path, index) => (
            <article className="class-path-editor" key={`${path.key}-${index}`}>
              <header>
                <strong>{path.name}</strong>
                <button
                  type="button"
                  onClick={() =>
                    setPayload({
                      ...payload,
                      paths: payload.paths.filter((_, current) => current !== index),
                    })
                  }
                >
                  Remover caminho
                </button>
              </header>
              <div className="race-form-grid race-form-grid--two">
                <Field label="Nome">
                  <input
                    value={path.name}
                    onChange={(e) =>
                      setPayload({
                        ...payload,
                        paths: payload.paths.map((item, current) =>
                          current === index ? { ...item, name: e.target.value } : item,
                        ),
                      })
                    }
                  />
                </Field>
                <Field label="Chave">
                  <input
                    value={path.key}
                    onChange={(e) =>
                      setPayload({
                        ...payload,
                        paths: payload.paths.map((item, current) =>
                          current === index
                            ? { ...item, key: createClassSlug(e.target.value) }
                            : item,
                        ),
                      })
                    }
                  />
                </Field>
                <Field label="Descrição">
                  <textarea
                    rows={4}
                    value={path.description}
                    onChange={(e) =>
                      setPayload({
                        ...payload,
                        paths: payload.paths.map((item, current) =>
                          current === index ? { ...item, description: e.target.value } : item,
                        ),
                      })
                    }
                  />
                </Field>
                <Field label="Passiva do caminho">
                  <input
                    value={path.passive.name}
                    onChange={(e) =>
                      setPayload({
                        ...payload,
                        paths: payload.paths.map((item, current) =>
                          current === index
                            ? { ...item, passive: { ...item.passive, name: e.target.value } }
                            : item,
                        ),
                      })
                    }
                  />
                  <textarea
                    rows={3}
                    value={path.passive.description}
                    onChange={(e) =>
                      setPayload({
                        ...payload,
                        paths: payload.paths.map((item, current) =>
                          current === index
                            ? { ...item, passive: { ...item.passive, description: e.target.value } }
                            : item,
                        ),
                      })
                    }
                  />
                </Field>
                <Field label="Missão de escolha · nível 50">
                  <input
                    value={path.quest.title}
                    onChange={(e) =>
                      setPayload({
                        ...payload,
                        paths: payload.paths.map((item, current) =>
                          current === index
                            ? { ...item, quest: { ...item.quest, title: e.target.value } }
                            : item,
                        ),
                      })
                    }
                  />
                  <textarea
                    rows={3}
                    value={path.quest.briefing}
                    onChange={(e) =>
                      setPayload({
                        ...payload,
                        paths: payload.paths.map((item, current) =>
                          current === index
                            ? { ...item, quest: { ...item.quest, briefing: e.target.value } }
                            : item,
                        ),
                      })
                    }
                  />
                </Field>
                <Field label="Objetivos da missão · um por linha">
                  <textarea
                    rows={5}
                    value={path.quest.objectives.join("\n")}
                    onChange={(e) =>
                      setPayload({
                        ...payload,
                        paths: payload.paths.map((item, current) =>
                          current === index
                            ? {
                                ...item,
                                quest: {
                                  ...item.quest,
                                  objectives: e.target.value
                                    .split("\n")
                                    .map((value) => value.trim())
                                    .filter(Boolean),
                                },
                              }
                            : item,
                        ),
                      })
                    }
                  />
                  <input
                    value={path.quest.completionText}
                    onChange={(e) =>
                      setPayload({
                        ...payload,
                        paths: payload.paths.map((item, current) =>
                          current === index
                            ? { ...item, quest: { ...item.quest, completionText: e.target.value } }
                            : item,
                        ),
                      })
                    }
                  />
                </Field>
              </div>
              <StructuredSkillEditor
                skills={path.skills}
                onChange={(skills) =>
                  setPayload({
                    ...payload,
                    paths: payload.paths.map((item, current) =>
                      current === index ? { ...item, skills } : item,
                    ),
                  })
                }
                title="Habilidade do caminho"
              />
            </article>
          ))}
        </Section>
        <footer className="race-editor-submit">
          <div>
            <span className="is-valid">✓ Contrato estruturado</span>
            <small>Valores podem ser alterados sem editar código.</small>
          </div>
          <div>
            <button className="button button--dark" disabled={pending} name="intent" value="save">
              Salvar
            </button>
            {!published ? (
              <button
                className="button button--primary"
                disabled={pending}
                name="intent"
                value="publish"
              >
                Publicar classe
              </button>
            ) : null}
          </div>
        </footer>
      </form>
    </div>
  );
}
function Section({
  index,
  title,
  description,
  children,
}: {
  index: string;
  title: string;
  description: string;
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
function Lines({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string[];
  onChange(value: string[]): void;
}) {
  return (
    <Field label={`${label} (uma por linha)`}>
      <textarea
        rows={5}
        value={value.join("\n")}
        onChange={(e) =>
          onChange(
            e.target.value
              .split("\n")
              .map((line) => line.trim())
              .filter(Boolean),
          )
        }
      />
    </Field>
  );
}
