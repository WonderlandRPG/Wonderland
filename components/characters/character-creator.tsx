"use client";

import { useActionState, useMemo, useState } from "react";

import { createCharacterAction } from "@/app/personagens/actions";
import { initialCharacterActionState } from "@/lib/game/character-forms";
import {
  buildCharacterPreset,
  type CharacterPreset,
} from "@/lib/game/character-presets";
import {
  createEmptyAllocation,
  getAllocatedTotal,
  type AllocatedAttributes,
} from "@/lib/game/characters";
import { attributeLabels, type RacePayload } from "@/lib/game/races";
import { attributeKeys, type AttributeKey } from "@/lib/game/schemas";
import { kingdoms } from "@/lib/game/kingdoms";

interface RaceOption {
  id: string;
  name: string;
  payload: RacePayload;
}
interface ClassOption {
  id: string;
  name: string;
  description: string;
  difficulty: number;
  specialization: string;
  primaryAttributes: AttributeKey[];
  resourceName: string;
  passiveName: string;
  passiveDescription: string;
  paths: Array<{ key: string; name: string; description: string }>;
}

export function CharacterCreator({
  races,
  classes,
  points,
  baseAttributes,
}: {
  races: RaceOption[];
  classes: ClassOption[];
  points: number;
  baseAttributes: AllocatedAttributes;
}) {
  const [state, action, pending] = useActionState(
    createCharacterAction,
    initialCharacterActionState,
  );
  const [allocation, setAllocation] = useState(createEmptyAllocation());
  const [raceId, setRaceId] = useState(races[0]?.id ?? "");
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [activePreset, setActivePreset] = useState<CharacterPreset | "custom">("custom");
  const [codexTab, setCodexTab] = useState<"race" | "class">("race");
  const [classPathKey, setClassPathKey] = useState(classes[0]?.paths[0]?.key ?? "");
  const selectedRace = useMemo(() => races.find((entry) => entry.id === raceId), [raceId, races]);
  const selectedClass = useMemo(
    () => classes.find((entry) => entry.id === classId),
    [classId, classes],
  );
  const used = getAllocatedTotal(allocation);
  const remaining = points - used;

  function update(attribute: AttributeKey, value: number) {
    const other = used - allocation[attribute];
    setAllocation((current) => ({
      ...current,
      [attribute]: Math.max(0, Math.min(points - other, Math.floor(value || 0))),
    }));
    setActivePreset("custom");
  }

  function applyPreset(preset: CharacterPreset) {
    if (!selectedRace || !selectedClass) return;
    setAllocation(
      buildCharacterPreset({
        preset,
        points,
        racialBonuses: selectedRace.payload.attributeBonuses,
        primaryAttributes: selectedClass.primaryAttributes,
      }),
    );
    setActivePreset(preset);
  }

  function selectRace(nextRaceId: string) {
    setRaceId(nextRaceId);
    const nextRace = races.find((entry) => entry.id === nextRaceId);
    if (activePreset !== "custom" && nextRace && selectedClass) {
      setAllocation(buildCharacterPreset({ preset: activePreset, points, racialBonuses: nextRace.payload.attributeBonuses, primaryAttributes: selectedClass.primaryAttributes }));
    }
  }

  function selectClass(nextClassId: string) {
    setClassId(nextClassId);
    const nextClass = classes.find((entry) => entry.id === nextClassId);
    setClassPathKey(nextClass?.paths[0]?.key ?? "");
    if (activePreset !== "custom" && selectedRace && nextClass) {
      setAllocation(buildCharacterPreset({ preset: activePreset, points, racialBonuses: selectedRace.payload.attributeBonuses, primaryAttributes: nextClass.primaryAttributes }));
    }
  }

  return (
    <form action={action} className="character-creator">
      <input name="allocation" type="hidden" value={JSON.stringify(allocation)} />
      {state.status === "error" ? (
        <div className="account-notice is-warning" data-sfx-on-mount="error" role="alert">
          <span>!</span>
          {state.message}
        </div>
      ) : null}

      <section className="character-create-section character-create-identity">
        <header>
          <span>01</span>
          <div>
            <h2>Identidade</h2>
            <p>Escolha o nome que aparecerá na ficha e na Arena.</p>
          </div>
        </header>
        <div className="character-identity-layout">
          <div
            className={`character-portrait-preview ${imageUrl ? "has-image" : ""}`}
            style={imageUrl ? { backgroundImage: `url(${JSON.stringify(imageUrl).slice(1, -1)})` } : undefined}
          >
            <span>{name.trim().slice(0, 1).toUpperCase() || "?"}</span>
            <small>Retrato do herói</small>
          </div>
          <div className="character-identity-fields">
            <label className="race-field">
              <span>Nome do personagem</span>
              <input maxLength={32} minLength={2} name="name" onChange={(event) => setName(event.target.value)} placeholder="Ex.: Aster" required value={name} />
            </label>
            <label className="race-field">
              <span>Reino de origem</span>
              <select name="kingdom" defaultValue={kingdoms[0].key} required>
                {kingdoms.map((kingdom) => (
                  <option key={kingdom.key} value={kingdom.key}>
                    {kingdom.name} · {kingdom.title}
                  </option>
                ))}
              </select>
              <small>Define a origem narrativa do personagem.</small>
            </label>
            <label className="race-field">
              <span>Imagem do personagem (opcional)</span>
              <input name="imageUrl" onChange={(event) => setImageUrl(event.target.value)} placeholder="https://exemplo.com/personagem.png" type="url" value={imageUrl} />
              <small>Cole o link direto de uma imagem pública.</small>
            </label>
          </div>
        </div>
      </section>

      <section className="character-create-section">
        <header>
          <span>02</span>
          <div>
            <h2>Raça e classe</h2>
            <p>Os dados vêm diretamente do conteúdo publicado pelo Painel ADM.</p>
          </div>
        </header>
        <div className="character-choice-grid">
          <label className="race-field">
            <span>Raça</span>
            <select
              name="raceId"
              required
              value={raceId}
              onChange={(event) => selectRace(event.target.value)}
            >
              {races.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </select>
          </label>
          <label className="race-field">
            <span>Classe</span>
            <select
              name="classId"
              required
              value={classId}
              onChange={(event) => selectClass(event.target.value)}
            >
              {classes.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="race-field character-path-field">
          <span>Caminho da classe</span>
          <select name="classPathKey" required value={classPathKey} onChange={(event) => setClassPathKey(event.target.value)}>
            {selectedClass?.paths.map((path) => <option key={path.key} value={path.key}>{path.name} · {path.description}</option>)}
          </select>
          <small>O caminho define a futura especialização desta ficha e poderá ser alterado pelo Painel ADM.</small>
        </label>
        <div className="character-choice-summary">
          <article>
            <span>Raça escolhida</span>
            <strong>{selectedRace?.name ?? "Nenhuma"}</strong>
            <small>
              HP {selectedRace?.payload.baseHp ?? 0} · Recurso {selectedRace?.payload.resource?.name ?? "racial"}
            </small>
          </article>
          <article>
            <span>Classe escolhida</span>
            <strong>{selectedClass?.name ?? "Nenhuma"}</strong>
            <small>{selectedClass?.specialization ?? "Sem especialização"}</small>
          </article>
        </div>
        <div className="character-build-preview">
          <span>Combinação escolhida</span>
          <strong>{selectedRace?.name} {selectedClass?.name}</strong>
          <small>
            Afinidades da classe: {selectedClass?.primaryAttributes.join(" · ") || "—"}
          </small>
        </div>
        <section className="character-choice-codex">
          <header>
            <div>
              <span className="eyebrow">Códice do aventureiro</span>
              <strong>Conheça antes de escolher</strong>
            </div>
            <div className="character-choice-codex__tabs" role="tablist" aria-label="Informações da escolha">
              <button aria-selected={codexTab === "race"} className={codexTab === "race" ? "is-active" : ""} onClick={() => setCodexTab("race")} role="tab" type="button">Sobre a raça</button>
              <button aria-selected={codexTab === "class"} className={codexTab === "class" ? "is-active" : ""} onClick={() => setCodexTab("class")} role="tab" type="button">Sobre a classe</button>
            </div>
          </header>
          {codexTab === "race" ? (
            <div className="character-choice-codex__content" role="tabpanel">
              <div>
                <small>Raça selecionada · {"★".repeat(selectedRace?.payload.difficulty ?? 1)}</small>
                <h3>{selectedRace?.name}</h3>
                <p>{selectedRace?.payload.description}</p>
              </div>
              <aside>
                <span>Especialização</span><strong>{selectedRace?.payload.specialization}</strong>
                <span>Recurso racial</span><strong>{selectedRace?.payload.resource?.name ?? "Nenhum"}</strong>
                <span>Traço inicial</span><strong>{selectedRace?.payload.traits[0]?.name ?? "—"}</strong>
              </aside>
            </div>
          ) : (
            <div className="character-choice-codex__content" role="tabpanel">
              <div>
                <small>Classe selecionada · {"★".repeat(selectedClass?.difficulty ?? 1)}</small>
                <h3>{selectedClass?.name}</h3>
                <p>{selectedClass?.description}</p>
              </div>
              <aside>
                <span>Especialização</span><strong>{selectedClass?.specialization}</strong>
                <span>Recurso de classe</span><strong>{selectedClass?.resourceName}</strong>
                <span>Passiva inicial</span><strong>{selectedClass?.passiveName}</strong>
                <small>{selectedClass?.passiveDescription}</small>
                <span>Caminho escolhido</span><strong>{selectedClass?.paths.find((path) => path.key === classPathKey)?.name ?? "—"}</strong>
              </aside>
            </div>
          )}
        </section>
      </section>

      <section className="character-create-section">
        <header>
          <span>03</span>
          <div>
            <h2>Distribuição de atributos</h2>
            <p>
              Todo atributo começa em 20, recebe os bônus da raça e mais os pontos que você
              distribuir.
            </p>
          </div>
          <div className={`character-points ${remaining === 0 ? "is-valid" : ""}`}>
            <strong>{remaining}</strong>
            <small>restantes</small>
          </div>
        </header>
        <div className="character-presets">
          <div>
            <span className="eyebrow">Distribuição automática</span>
            <strong>Escolha um estilo de combate</strong>
            <small>O cálculo combina os bônus de {selectedRace?.name} com as afinidades de {selectedClass?.name}.</small>
          </div>
          <div className="character-preset-buttons">
            <button className={activePreset === "aggressive" ? "is-active" : ""} onClick={() => applyPreset("aggressive")} type="button">
              <span>⚔</span><strong>Agressivo</strong><small>Prioriza dano e iniciativa</small>
            </button>
            <button className={activePreset === "balanced" ? "is-active" : ""} onClick={() => applyPreset("balanced")} type="button">
              <span>✦</span><strong>Equilibrado</strong><small>Distribuição versátil</small>
            </button>
            <button className={activePreset === "defensive" ? "is-active" : ""} onClick={() => applyPreset("defensive")} type="button">
              <span>◆</span><strong>Defensivo</strong><small>Prioriza DEF e RES</small>
            </button>
          </div>
        </div>
        <div className="character-attribute-grid">
          {attributeKeys.map((attribute) => {
            const racial = selectedRace?.payload.attributeBonuses[attribute] ?? 0;
            const total = baseAttributes[attribute] + allocation[attribute] + racial;
            return (
              <article key={attribute}>
                <div>
                  <span>{attribute}</span>
                  <small>{attributeLabels[attribute]}</small>
                </div>
                <strong>{total}</strong>
                <div className="character-stepper">
                  <button
                    aria-label={`Remover ponto de ${attribute}`}
                    disabled={allocation[attribute] === 0}
                    type="button"
                    onClick={() => update(attribute, allocation[attribute] - 1)}
                  >
                    −
                  </button>
                  <input
                    aria-label={`Pontos livres em ${attribute}`}
                    min={0}
                    type="number"
                    value={allocation[attribute]}
                    onChange={(event) => update(attribute, Number(event.target.value))}
                  />
                  <button
                    aria-label={`Adicionar ponto em ${attribute}`}
                    disabled={remaining === 0}
                    type="button"
                    onClick={() => update(attribute, allocation[attribute] + 1)}
                  >
                    ＋
                  </button>
                </div>
                <small>
                  20 base + {allocation[attribute]} livre + {racial} racial
                </small>
              </article>
            );
          })}
        </div>
      </section>

      <footer className="character-create-submit">
        <div>
          <strong>
            {remaining === 0
              ? "Ficha pronta para criação"
              : `Distribua os ${remaining} pontos restantes`}
          </strong>
          <small>Depois de criada, raça, classe e pontos não podem ser trocados livremente.</small>
        </div>
        <button
          className="button button--primary"
          data-sfx="confirm"
          disabled={pending || remaining !== 0 || !raceId || !classId}
          type="submit"
        >
          {pending ? "Criando..." : "Criar personagem"}
        </button>
      </footer>
    </form>
  );
}
