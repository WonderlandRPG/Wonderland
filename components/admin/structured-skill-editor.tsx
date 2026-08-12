"use client";

import { createEmptyClassSkill, type ClassSkill } from "@/lib/game/classes";
import { attributeKeys, engineOperationKeys } from "@/lib/game/schemas";

const categories = [
  "Dano",
  "Cura",
  "Escudo",
  "Buff",
  "Debuff",
  "Controle",
  "Mobilidade",
  "Invocação",
  "Utilidade",
];
const operationLabels: Record<(typeof engineOperationKeys)[number], string> = {
  DAMAGE: "Causar dano",
  HEAL: "Curar",
  SHIELD: "Criar escudo",
  BUFF: "Aplicar buff",
  DEBUFF: "Aplicar debuff",
  STUN: "Atordoar",
  ROOT: "Imobilizar",
  SILENCE: "Silenciar",
  FEAR: "Amedrontar",
  PUSH: "Empurrar",
  MOVE: "Mover",
  TELEPORT: "Teleportar",
  APPLY_STATUS: "Aplicar status",
  REMOVE_STATUS: "Remover status",
  RESOURCE_GAIN: "Gerar recurso",
  RESOURCE_COST: "Consumir recurso",
  SUMMON: "Invocar",
  TAUNT: "Provocar",
  REACTION: "Executar reação",
};

export function StructuredSkillEditor({
  skills,
  onChange,
  title = "Habilidade",
}: {
  skills: ClassSkill[];
  onChange(skills: ClassSkill[]): void;
  title?: string;
}) {
  const update = (index: number, patch: Partial<ClassSkill>) =>
    onChange(skills.map((skill, current) => (current === index ? { ...skill, ...patch } : skill)));

  return (
    <div className="structured-skills">
      <div className="structured-skills__intro">
        <div>
          <strong>Contrato do motor da Arena</strong>
          <p>
            Cada campo abaixo é lido pelo combate. A descrição do jogador não substitui as regras.
          </p>
        </div>
        <button
          className="admin-add-button"
          type="button"
          onClick={() =>
            onChange([
              ...skills,
              { ...createEmptyClassSkill(), key: `nova-habilidade-${skills.length + 1}` },
            ])
          }
        >
          ＋ Adicionar habilidade
        </button>
      </div>
      {skills.length === 0 ? (
        <div className="race-dynamic-empty">
          <span>＋</span>
          <p>Nenhuma habilidade estruturada cadastrada.</p>
        </div>
      ) : null}
      {skills.map((skill, index) => (
        <details
          className="structured-skill"
          key={`${skill.key}-${index}`}
          open={skills.length === 1}
        >
          <summary>
            <div>
              <span>
                {title} {String(index + 1).padStart(2, "0")}
              </span>
              <strong>{skill.name || "Sem nome"}</strong>
            </div>
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                onChange(skills.filter((_, current) => current !== index));
              }}
            >
              Remover
            </button>
          </summary>
          <div className="structured-skill__group">
            <h3>Identidade e desbloqueio</h3>
            <div className="structured-skill__grid structured-skill__grid--4">
              <Field label="Nome">
                <input
                  value={skill.name}
                  onChange={(e) => update(index, { name: e.target.value })}
                />
              </Field>
              <Field label="Chave do sistema" hint="minúsculas e hífens">
                <input
                  value={skill.key}
                  onChange={(e) =>
                    update(index, {
                      key: e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/^-|-$/g, ""),
                    })
                  }
                />
              </Field>
              <Field label="Nível">
                <input
                  min={1}
                  max={100}
                  type="number"
                  value={skill.level}
                  onChange={(e) => update(index, { level: Number(e.target.value) })}
                />
              </Field>
              <Field label="Tipo">
                <select
                  value={skill.type}
                  onChange={(e) => update(index, { type: e.target.value })}
                >
                  <option>Ativa</option>
                  <option>Passiva</option>
                  <option>Reação</option>
                </select>
              </Field>
              <Field label="Categoria">
                <select
                  value={skill.category}
                  onChange={(e) => update(index, { category: e.target.value })}
                >
                  {categories.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </Field>
              <Field label="Natureza">
                <select
                  value={skill.kind}
                  onChange={(e) => update(index, { kind: e.target.value as ClassSkill["kind"] })}
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
                  onChange={(e) =>
                    update(index, { damageType: e.target.value as ClassSkill["damageType"] })
                  }
                >
                  <option value="none">Não causa dano</option>
                  <option value="physical">Físico</option>
                  <option value="magic">Mágico</option>
                  <option value="true">Verdadeiro</option>
                </select>
              </Field>
              <Field label="Alvo">
                <select
                  value={skill.target}
                  onChange={(e) =>
                    update(index, { target: e.target.value as ClassSkill["target"] })
                  }
                >
                  <option value="self">Próprio personagem</option>
                  <option value="ally">Aliado</option>
                  <option value="enemy">Inimigo</option>
                  <option value="area">Área</option>
                </select>
              </Field>
            </div>
          </div>
          <div className="structured-skill__group">
            <h3>Custo, alcance e tempo</h3>
            <div className="structured-skill__grid structured-skill__grid--6">
              <Field label="Recurso">
                <select
                  value={skill.resource}
                  onChange={(e) =>
                    update(index, { resource: e.target.value as ClassSkill["resource"] })
                  }
                >
                  <option value="life">Vida</option>
                  <option value="special">Recurso especial</option>
                  <option value="none">Sem custo</option>
                </select>
              </Field>
              <Field label="Origem">
                <select
                  value={skill.resourceKey}
                  onChange={(e) =>
                    update(index, { resourceKey: e.target.value as "class" | "race" })
                  }
                >
                  <option value="class">Classe</option>
                  <option value="race">Raça</option>
                </select>
              </Field>
              <NumberField
                label="Custo"
                value={skill.cost}
                onChange={(value) => update(index, { cost: value })}
              />
              <NumberField
                label="Recarga (turnos)"
                value={skill.cooldown}
                onChange={(value) => update(index, { cooldown: value })}
              />
              <NumberField
                label="Alcance (casas)"
                value={skill.range}
                onChange={(value) => update(index, { range: value })}
              />
              <NumberField
                label="Área (casas)"
                value={skill.area}
                onChange={(value) => update(index, { area: value })}
              />
              <NumberField
                label="Duração (turnos)"
                value={skill.duration}
                onChange={(value) => update(index, { duration: value })}
              />
              <NumberField
                label="Chance (%)"
                value={skill.chance}
                onChange={(value) => update(index, { chance: value })}
              />
              <NumberField
                label="Máx. acúmulos"
                value={skill.maxStacks}
                onChange={(value) => update(index, { maxStacks: value })}
              />
              <Field label="Alcance explicado">
                <input
                  value={skill.reachText}
                  onChange={(e) => update(index, { reachText: e.target.value })}
                />
              </Field>
            </div>
          </div>
          <div className="structured-skill__group">
            <h3>Escalonamento</h3>
            <div className="structured-scaling">
              {skill.scaling.map((scale, scaleIndex) => (
                <div key={scaleIndex}>
                  <select
                    value={scale.attribute}
                    onChange={(e) =>
                      update(index, {
                        scaling: skill.scaling.map((item, current) =>
                          current === scaleIndex
                            ? { ...item, attribute: e.target.value as typeof item.attribute }
                            : item,
                        ),
                      })
                    }
                  >
                    {attributeKeys.map((attribute) => (
                      <option key={attribute}>{attribute}</option>
                    ))}
                  </select>
                  <input
                    min={0}
                    step="0.05"
                    type="number"
                    value={scale.multiplier}
                    onChange={(e) =>
                      update(index, {
                        scaling: skill.scaling.map((item, current) =>
                          current === scaleIndex
                            ? { ...item, multiplier: Number(e.target.value) }
                            : item,
                        ),
                      })
                    }
                  />
                  <span>× atributo</span>
                  <button
                    type="button"
                    onClick={() =>
                      update(index, {
                        scaling: skill.scaling.filter((_, current) => current !== scaleIndex),
                      })
                    }
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  update(index, {
                    scaling: [...skill.scaling, { attribute: "FOR", multiplier: 1 }],
                  })
                }
              >
                ＋ Adicionar atributo-base
              </button>
            </div>
          </div>
          <div className="structured-skill__group">
            <h3>Operações executadas em ordem</h3>
            <p className="structured-skill__help">
              O motor resolve esta lista de cima para baixo. Use uma operação para cada dano, cura,
              status, movimento ou mudança de recurso.
            </p>
            <div className="structured-operations">
              {skill.operations.map((operation, operationIndex) => (
                <div className="structured-operation" key={operationIndex}>
                  <span>{String(operationIndex + 1).padStart(2, "0")}</span>
                  <select
                    value={operation.operation}
                    onChange={(e) =>
                      update(index, {
                        operations: skill.operations.map((item, current) =>
                          current === operationIndex
                            ? { ...item, operation: e.target.value as typeof item.operation }
                            : item,
                        ),
                      })
                    }
                  >
                    {engineOperationKeys.map((key) => (
                      <option key={key} value={key}>
                        {operationLabels[key]}
                      </option>
                    ))}
                  </select>
                  <select
                    value={operation.target}
                    onChange={(e) =>
                      update(index, {
                        operations: skill.operations.map((item, current) =>
                          current === operationIndex
                            ? { ...item, target: e.target.value as typeof item.target }
                            : item,
                        ),
                      })
                    }
                  >
                    <option value="self">Si mesmo</option>
                    <option value="ally">Aliado</option>
                    <option value="enemy">Inimigo</option>
                    <option value="area">Área</option>
                    <option value="source">Fonte</option>
                  </select>
                  <input
                    aria-label="Valor base"
                    min={0}
                    placeholder="Valor base"
                    type="number"
                    value={operation.base}
                    onChange={(e) =>
                      update(index, {
                        operations: skill.operations.map((item, current) =>
                          current === operationIndex
                            ? { ...item, base: Number(e.target.value) }
                            : item,
                        ),
                      })
                    }
                  />
                  <input
                    aria-label="Status"
                    placeholder="Status/efeito"
                    value={operation.status}
                    onChange={(e) =>
                      update(index, {
                        operations: skill.operations.map((item, current) =>
                          current === operationIndex ? { ...item, status: e.target.value } : item,
                        ),
                      })
                    }
                  />
                  <button
                    type="button"
                    onClick={() =>
                      update(index, {
                        operations: skill.operations.filter(
                          (_, current) => current !== operationIndex,
                        ),
                      })
                    }
                  >
                    Remover
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  update(index, {
                    operations: [...skill.operations, createEmptyClassSkill().operations[0]],
                  })
                }
              >
                ＋ Adicionar operação
              </button>
            </div>
          </div>
          <div className="structured-skill__group structured-skill__text">
            <h3>Regras e comunicação</h3>
            <Field label="Efeitos adicionais / resumo técnico">
              <textarea
                rows={3}
                value={skill.effect}
                onChange={(e) => update(index, { effect: e.target.value })}
              />
            </Field>
            <Field label="Condições" hint="Uma por linha">
              <textarea
                rows={3}
                value={skill.conditions.join("\n")}
                onChange={(e) =>
                  update(index, {
                    conditions: e.target.value
                      .split("\n")
                      .map((value) => value.trim())
                      .filter(Boolean),
                  })
                }
              />
            </Field>
            <Field
              label="Regra do Sistema"
              hint="Determinística: ordem, números, condição e resolução."
            >
              <textarea
                rows={5}
                value={skill.systemRule}
                onChange={(e) => update(index, { systemRule: e.target.value })}
              />
            </Field>
            <Field label="Descrição para o jogador" hint="Texto claro exibido na ficha e na Arena.">
              <textarea
                rows={5}
                value={skill.playerDescription}
                onChange={(e) => update(index, { playerDescription: e.target.value })}
              />
            </Field>
          </div>
        </details>
      ))}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="race-field">
      <span>{label}</span>
      {children}
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange(value: number): void;
}) {
  return (
    <Field label={label}>
      <input
        min={0}
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </Field>
  );
}
