"use client";

import { useActionState, useMemo, useState } from "react";

import { createCharacterAction } from "@/app/personagens/actions";
import { initialCharacterActionState } from "@/lib/game/character-forms";
import {
  buildReworkPreset,
  emptyReworkAllocation,
  reworkAttributeKeys,
  reworkAttributeTotal,
  type GrowthProfile,
  type ReworkAttributeKey,
  type ReworkAttributes,
} from "@/lib/game/rework-attributes";
import { kingdoms } from "@/lib/game/kingdoms";

interface RaceOption {
  id: string;
  name: string;
  description: string;
  epithet: string;
  firstPowerName: string;
  imageUrl: string;
  baseStats: ReworkAttributes;
}
interface ClassOption {
  id: string;
  name: string;
  description: string;
  role: string;
  magical: boolean;
  passiveName: string;
  passiveDescription: string;
}

export function CharacterCreator({
  races,
  classes,
  points,
}: {
  races: RaceOption[];
  classes: ClassOption[];
  points: number;
}) {
  const [state, action, pending] = useActionState(
    createCharacterAction,
    initialCharacterActionState,
  );
  const [allocation, setAllocation] = useState(emptyReworkAllocation());
  const [raceId, setRaceId] = useState(races[0]?.id ?? "");
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [activePreset, setActivePreset] = useState<GrowthProfile>("custom");
  const [codexTab, setCodexTab] = useState<"race" | "class">("race");
  const selectedRace = useMemo(() => races.find((entry) => entry.id === raceId), [raceId, races]);
  const selectedClass = useMemo(
    () => classes.find((entry) => entry.id === classId),
    [classId, classes],
  );
  const used = reworkAttributeTotal(allocation);
  const remaining = points - used;

  function update(attribute: ReworkAttributeKey, value: number) {
    const other = used - allocation[attribute];
    setAllocation((current) => ({
      ...current,
      [attribute]: Math.max(0, Math.min(points - other, Math.floor(value || 0))),
    }));
    setActivePreset("custom");
  }

  function applyPreset(preset: Exclude<GrowthProfile, "custom">) {
    if (!selectedClass) return;
    setAllocation(buildReworkPreset(preset, selectedClass.magical));
    setActivePreset(preset);
  }

  function selectRace(nextRaceId: string) {
    setRaceId(nextRaceId);
  }

  function selectClass(nextClassId: string) {
    setClassId(nextClassId);
    const nextClass = classes.find((entry) => entry.id === nextClassId);
    if (activePreset !== "custom" && nextClass) {
      setAllocation(buildReworkPreset(activePreset, nextClass.magical));
    }
  }

  return (
    <form action={action} className="character-creator">
      <input name="allocation" type="hidden" value={JSON.stringify(allocation)} />
      <input name="growthProfile" type="hidden" value={activePreset} />
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
            style={
              imageUrl
                ? { backgroundImage: `url(${JSON.stringify(imageUrl).slice(1, -1)})` }
                : undefined
            }
          >
            <span>{name.trim().slice(0, 1).toUpperCase() || "?"}</span>
            <small>Retrato do herói</small>
          </div>
          <div className="character-identity-fields">
            <label className="race-field">
              <span>Nome do personagem</span>
              <input
                maxLength={32}
                minLength={2}
                name="name"
                onChange={(event) => setName(event.target.value)}
                placeholder="Ex.: Aster"
                required
                value={name}
              />
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
              <input
                name="imageUrl"
                onChange={(event) => setImageUrl(event.target.value)}
                placeholder="https://exemplo.com/personagem.png"
                type="url"
                value={imageUrl}
              />
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
        <div className="account-notice">
          <span>50</span> O personagem começa sem caminho. A especialização fica disponível no nível
          50.
        </div>
        <div className="character-choice-summary">
          <article>
            <span>Raça escolhida</span>
            <strong>{selectedRace?.name ?? "Nenhuma"}</strong>
            <small>
              HP base {selectedRace?.baseStats.HP ?? 0} · {selectedRace?.epithet ?? "Raça"}
            </small>
          </article>
          <article>
            <span>Classe escolhida</span>
            <strong>{selectedClass?.name ?? "Nenhuma"}</strong>
            <small>{selectedClass?.role ?? "Classe"}</small>
          </article>
        </div>
        <div className="character-build-preview">
          <span>Combinação escolhida</span>
          <strong>
            {selectedRace?.name} {selectedClass?.name}
          </strong>
          <small>{selectedClass?.role ?? "Escolha uma classe"}</small>
        </div>
        <section className="character-choice-codex">
          <header>
            <div>
              <span className="eyebrow">Códice do aventureiro</span>
              <strong>Conheça antes de escolher</strong>
            </div>
            <div
              className="character-choice-codex__tabs"
              role="tablist"
              aria-label="Informações da escolha"
            >
              <button
                aria-selected={codexTab === "race"}
                className={codexTab === "race" ? "is-active" : ""}
                onClick={() => setCodexTab("race")}
                role="tab"
                type="button"
              >
                Sobre a raça
              </button>
              <button
                aria-selected={codexTab === "class"}
                className={codexTab === "class" ? "is-active" : ""}
                onClick={() => setCodexTab("class")}
                role="tab"
                type="button"
              >
                Sobre a classe
              </button>
            </div>
          </header>
          {codexTab === "race" ? (
            <div className="character-choice-codex__content" role="tabpanel">
              <div>
                {selectedRace?.imageUrl ? (
                  <span
                    className="character-codex-portrait"
                    style={{ backgroundImage: `url(${selectedRace.imageUrl})` }}
                    role="img"
                    aria-label={`Arte oficial de ${selectedRace.name}`}
                  />
                ) : null}
                <small>Raça selecionada · Rework</small>
                <h3>{selectedRace?.name}</h3>
                <p>{selectedRace?.description}</p>
              </div>
              <aside>
                <span>Origem</span>
                <strong>{selectedRace?.epithet}</strong>
                <span>Característica inicial</span>
                <strong>{selectedRace?.firstPowerName ?? "—"}</strong>
              </aside>
            </div>
          ) : (
            <div className="character-choice-codex__content" role="tabpanel">
              <div>
                <small>Classe selecionada · Rework</small>
                <h3>{selectedClass?.name}</h3>
                <p>{selectedClass?.description}</p>
              </div>
              <aside>
                <span>Papel em combate</span>
                <strong>{selectedClass?.role}</strong>
                <span>Passiva inicial</span>
                <strong>{selectedClass?.passiveName}</strong>
                <small>{selectedClass?.passiveDescription}</small>
                <span>Caminho</span>
                <strong>Disponível no nível 50</strong>
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
              Distribua 20 estrelas. O resultado soma as bases raciais, sua distribuição e os
              equipamentos.
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
            <small>O perfil define a distribuição inicial e pode ser ajustado livremente.</small>
          </div>
          <div className="character-preset-buttons">
            <button
              className={activePreset === "aggressive" ? "is-active" : ""}
              onClick={() => applyPreset("aggressive")}
              type="button"
            >
              <span>⚔</span>
              <strong>Agressivo</strong>
              <small>Prioriza dano e iniciativa</small>
            </button>
            <button
              className={activePreset === "balanced" ? "is-active" : ""}
              onClick={() => applyPreset("balanced")}
              type="button"
            >
              <span>✦</span>
              <strong>Equilibrado</strong>
              <small>Distribuição versátil</small>
            </button>
            <button
              className={activePreset === "defensive" ? "is-active" : ""}
              onClick={() => applyPreset("defensive")}
              type="button"
            >
              <span>◆</span>
              <strong>Defensivo</strong>
              <small>Prioriza DEF e RES</small>
            </button>
          </div>
        </div>
        <div className="character-attribute-grid">
          {reworkAttributeKeys.map((attribute) => {
            const racial = selectedRace?.baseStats[attribute] ?? 0;
            const total = racial + allocation[attribute];
            return (
              <article key={attribute}>
                <div>
                  <span>{attribute}</span>
                  <small>
                    {
                      {
                        FOR: "Força",
                        INT: "Inteligência",
                        DEF: "Defesa",
                        RES: "Resistência",
                        HP: "Vida",
                        INI: "Iniciativa",
                      }[attribute]
                    }
                  </small>
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
                  {racial} racial + {allocation[attribute]} estrelas
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
