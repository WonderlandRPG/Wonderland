"use client";

import { useActionState, useMemo, useState } from "react";

import { createCharacterAction } from "@/app/personagens/actions";
import { initialCharacterActionState } from "@/lib/game/character-forms";
import {
  createEmptyAllocation,
  getAllocatedTotal,
  type AllocatedAttributes,
} from "@/lib/game/characters";
import { attributeLabels, type RacePayload } from "@/lib/game/races";
import { attributeKeys, type AttributeKey } from "@/lib/game/schemas";

interface RaceOption {
  id: string;
  name: string;
  payload: RacePayload;
}
interface ClassOption {
  id: string;
  name: string;
  specialization: string;
  primaryAttributes: AttributeKey[];
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

      <section className="character-create-section">
        <header>
          <span>01</span>
          <div>
            <h2>Identidade</h2>
            <p>Escolha o nome que aparecerá na ficha e na Arena.</p>
          </div>
        </header>
        <label className="race-field">
          <span>Nome do personagem</span>
          <input maxLength={32} minLength={2} name="name" placeholder="Ex.: Aster" required />
        </label>
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
              onChange={(event) => setRaceId(event.target.value)}
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
              onChange={(event) => setClassId(event.target.value)}
            >
              {classes.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="character-choice-summary">
          <article>
            <span>Raça escolhida</span>
            <strong>{selectedRace?.name ?? "Nenhuma"}</strong>
            <small>
              HP {selectedRace?.payload.baseHp ?? 0} · Mana {selectedRace?.payload.baseMana ?? 0}
            </small>
          </article>
          <article>
            <span>Classe escolhida</span>
            <strong>{selectedClass?.name ?? "Nenhuma"}</strong>
            <small>{selectedClass?.specialization ?? "Sem especialização"}</small>
          </article>
        </div>
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
