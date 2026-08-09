"use client";

import { useMemo, useState } from "react";

import {
  createCombatant,
  getRaceAbilityCooldown,
  resolveBasicAttack,
  resolveRaceAbility,
  resolveSkill,
  tickCooldowns,
  type CombatAttributes,
  type CombatRules,
  type CombatantState,
} from "@/lib/game/combat";
import type { ClassSkill } from "@/lib/game/classes";
import type { RaceProgressionEntry } from "@/lib/game/races";

interface ArenaCharacter {
  id: string;
  name: string;
  raceName: string;
  className: string;
  baseHp: number;
  baseMana: number;
  attributes: CombatAttributes;
  skills: ClassSkill[];
  raceAbilities: RaceProgressionEntry[];
  items: Array<{ id: string; name: string; description: string }>;
}

type TurnActions = { basic: boolean; race: boolean; class: boolean; item: boolean };
const freshActions: TurnActions = { basic: false, race: false, class: false, item: false };

export function TrainingArena({
  characters,
  initialCharacterId,
  rules,
}: {
  characters: ArenaCharacter[];
  initialCharacterId?: string;
  rules: CombatRules;
}) {
  const firstId = characters.some((entry) => entry.id === initialCharacterId)
    ? initialCharacterId!
    : (characters[0]?.id ?? "");
  const [selectedId, setSelectedId] = useState(firstId);
  const [resetKey, setResetKey] = useState(0);
  const selected = useMemo(
    () => characters.find((entry) => entry.id === selectedId) ?? characters[0],
    [characters, selectedId],
  );
  if (!selected) {
    return (
      <section className="arena-empty">
        <span>ARENA</span>
        <h1>Crie um personagem primeiro</h1>
        <p>A Arena usa os atributos e as habilidades reais da ficha.</p>
      </section>
    );
  }
  return (
    <Battle
      key={`${selected.id}-${resetKey}`}
      character={selected}
      options={characters}
      rules={rules}
      onChange={setSelectedId}
      onReset={() => setResetKey((value) => value + 1)}
    />
  );
}

function Battle({
  character,
  options,
  rules,
  onChange,
  onReset,
}: {
  character: ArenaCharacter;
  options: ArenaCharacter[];
  rules: CombatRules;
  onChange(id: string): void;
  onReset(): void;
}) {
  const initial = useMemo(() => createBattle(character, rules), [character, rules]);
  const [player, setPlayer] = useState(initial.player);
  const [enemy, setEnemy] = useState(initial.enemy);
  const [turn, setTurn] = useState(1);
  const [actions, setActions] = useState<TurnActions>(freshActions);
  const [newCooldowns, setNewCooldowns] = useState<string[]>([]);
  const [message, setMessage] = useState("Escolha sua primeira ação.");
  const finished = player.hp <= 0 || enemy.hp <= 0;

  function applyPlayerAction(
    nextPlayer: CombatantState,
    nextEnemy: CombatantState,
    text: string,
    action: keyof TurnActions,
  ) {
    setPlayer(nextPlayer);
    setEnemy(nextEnemy);
    setNewCooldowns((current) => [
      ...new Set([
        ...current,
        ...Object.keys(nextPlayer.cooldowns).filter(
          (key) => (nextPlayer.cooldowns[key] ?? 0) > (player.cooldowns[key] ?? 0),
        ),
      ]),
    ]);
    setActions((current) => ({ ...current, [action]: true }));
    if (nextEnemy.hp <= 0) {
      setMessage(`${text} Vitória!`);
      return;
    }
    setMessage(text);
  }

  function finishTurn() {
    if (finished || !Object.values(actions).some(Boolean)) return;
    const reply = resolveBasicAttack(enemy, player, rules);
    const cooledPlayer = tickCooldowns(reply.target);
    for (const key of newCooldowns) cooledPlayer.cooldowns[key] = reply.target.cooldowns[key] ?? 0;
    setPlayer(cooledPlayer);
    setEnemy(reply.actor);
    setTurn((value) => value + 1);
    setActions(freshActions);
    setNewCooldowns([]);
    setMessage(
      reply.target.hp <= 0
        ? `${reply.event.message} Você foi derrotado.`
        : `${reply.event.message} Nova rodada: escolha suas ações.`,
    );
  }

  function attack() {
    if (finished || actions.basic) return;
    const result = resolveBasicAttack(player, enemy, rules);
    applyPlayerAction(result.actor, result.target, result.event.message, "basic");
  }

  function handleSkill(skill: ClassSkill) {
    if (finished || actions.class) return;
    const result = resolveSkill(player, enemy, skill, rules);
    if (result.event.kind === "error") {
      setMessage(result.event.message);
      return;
    }
    applyPlayerAction(result.actor, result.target, result.event.message, "class");
  }

  function handleRaceAbility(ability: RaceProgressionEntry) {
    if (finished || actions.race) return;
    const result = resolveRaceAbility(player, enemy, ability, rules);
    if (result.event.kind === "error") return setMessage(result.event.message);
    applyPlayerAction(result.actor, result.target, result.event.message, "race");
  }

  function handleItem(item: ArenaCharacter["items"][number]) {
    if (finished || actions.item) return;
    const healed = Math.min(
      Math.max(25, Math.round(player.maxHp * 0.25)),
      player.maxHp - player.hp,
    );
    applyPlayerAction(
      { ...player, hp: player.hp + healed },
      enemy,
      `${character.name} usou ${item.name} e recuperou ${healed} de HP.`,
      "item",
    );
  }

  return (
    <section className="arena-console">
      <header className="arena-toolbar">
        <div>
          <span className="eyebrow">Simulação sem recompensas</span>
          <h1>Arena de Treinamento</h1>
        </div>
        <label>
          Personagem
          <select value={character.id} onChange={(event) => onChange(event.target.value)}>
            {options.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name} · {entry.className}
              </option>
            ))}
          </select>
        </label>
        <strong>Turno {turn}</strong>
      </header>
      <div className="arena-stage">
        <Fighter combatant={player} subtitle={`${character.raceName} · ${character.className}`} />
        <b>VS</b>
        <Fighter combatant={enemy} subtitle="Oponente de treino" />
      </div>
      <p className="arena-message" role="status">
        {message}
      </p>
      <div className="arena-turn-budget" aria-label="Ações desta rodada">
        <span className={actions.basic ? "is-used" : ""}>Ataque {actions.basic ? "✓" : "1"}</span>
        <span className={actions.race ? "is-used" : ""}>Raça {actions.race ? "✓" : "1"}</span>
        <span className={actions.class ? "is-used" : ""}>Classe {actions.class ? "✓" : "1"}</span>
        <span className={actions.item ? "is-used" : ""}>Item {actions.item ? "✓" : "1"}</span>
      </div>
      <div className="arena-actions">
        <button disabled={finished || actions.basic} onClick={attack} type="button">
          <strong>Ataque básico</strong>
          <span>
            1x{" "}
            {player.attributes.INT > player.attributes.FOR
              ? "INT · dano mágico"
              : "FOR · dano físico"}
          </span>
        </button>
        {character.raceAbilities.map((ability) => {
          const cooldown = getRaceAbilityCooldown(player, ability);
          return (
            <button
              disabled={finished || actions.race || cooldown > 0}
              key={`${ability.level}-${ability.title}`}
              onClick={() => handleRaceAbility(ability)}
              type="button"
            >
              <strong>{ability.title}</strong>
              <span>{ability.description.split("\n")[0]}</span>
              <small>{cooldown ? `Recarga: ${cooldown}` : "Habilidade de raça"}</small>
            </button>
          );
        })}
        {character.skills.map((skill) => {
          const cooldown = player.cooldowns[skill.key] ?? 0;
          const cannotPay = skill.resource === "mana" && player.mana < skill.cost;
          return (
            <button
              disabled={finished || actions.class || cooldown > 0 || cannotPay}
              key={skill.key}
              onClick={() => handleSkill(skill)}
              type="button"
            >
              <strong>{skill.name}</strong>
              <span>{skill.effect}</span>
              <small>
                {cooldown
                  ? `Recarga: ${cooldown}`
                  : `${skill.cost} ${skill.resource === "mana" ? "Mana" : "HP"}`}
              </small>
            </button>
          );
        })}
        {character.items.length ? (
          character.items.map((item) => (
            <button
              disabled={finished || actions.item}
              key={item.id}
              onClick={() => handleItem(item)}
              type="button"
            >
              <strong>{item.name}</strong>
              <span>{item.description}</span>
              <small>Item consumível</small>
            </button>
          ))
        ) : (
          <button disabled type="button">
            <strong>Item</strong>
            <span>Nenhum consumível no inventário.</span>
          </button>
        )}
      </div>
      {!finished ? (
        <button
          className="button button--primary arena-end-turn"
          disabled={!Object.values(actions).some(Boolean)}
          onClick={finishTurn}
          type="button"
        >
          Encerrar rodada
        </button>
      ) : null}
      {finished ? (
        <button className="button button--primary" onClick={onReset} type="button">
          Treinar novamente
        </button>
      ) : null}
    </section>
  );
}

function Fighter({ combatant, subtitle }: { combatant: CombatantState; subtitle: string }) {
  return (
    <article className="arena-fighter">
      <span className="eyebrow">{subtitle}</span>
      <h2>{combatant.name}</h2>
      <p>
        HP{" "}
        <strong>
          {combatant.hp}/{combatant.maxHp}
        </strong>
      </p>
      <progress max={combatant.maxHp} value={combatant.hp} />
      <p>
        Mana{" "}
        <strong>
          {combatant.mana}/{combatant.maxMana}
        </strong>
      </p>
      <progress max={combatant.maxMana || 1} value={combatant.mana} />
      {combatant.shield > 0 ? <small>Escudo: {combatant.shield}</small> : null}
    </article>
  );
}

function createBattle(character: ArenaCharacter, rules: CombatRules) {
  const player = createCombatant({ ...character, rules });
  const enemyAttributes: CombatAttributes = {
    FOR: Math.max(35, Math.round(character.attributes.FOR * 0.55)),
    DEF: Math.max(25, Math.round(character.attributes.DEF * 0.65)),
    RES: Math.max(25, Math.round(character.attributes.RES * 0.65)),
    INI: Math.max(20, character.attributes.INI - 10),
    INT: 20,
    ARC: 0,
  };
  const enemy = createCombatant({
    id: "training",
    name: "Boneco Rúnico",
    attributes: enemyAttributes,
    baseHp: Math.max(450, Math.round(player.maxHp * 0.7)),
    baseMana: 0,
    rules,
  });
  return { player, enemy };
}
