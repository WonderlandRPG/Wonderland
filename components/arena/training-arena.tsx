"use client";

import { useMemo, useState } from "react";

import {
  createCombatant,
  resolveBasicAttack,
  resolveSkill,
  tickCooldowns,
  type CombatAttributes,
  type CombatRules,
  type CombatantState,
} from "@/lib/game/combat";
import type { ClassSkill } from "@/lib/game/classes";

interface ArenaCharacter {
  id: string;
  name: string;
  raceName: string;
  className: string;
  baseHp: number;
  baseMana: number;
  attributes: CombatAttributes;
  skills: ClassSkill[];
}

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
  const [message, setMessage] = useState("Escolha sua primeira ação.");
  const finished = player.hp <= 0 || enemy.hp <= 0;

  function complete(nextPlayer: CombatantState, nextEnemy: CombatantState, text: string) {
    if (nextEnemy.hp <= 0) {
      setPlayer(nextPlayer);
      setEnemy(nextEnemy);
      setMessage(`${text} Vitória!`);
      return;
    }
    const reply = resolveBasicAttack(nextEnemy, nextPlayer, rules);
    setPlayer(tickCooldowns(reply.target));
    setEnemy(reply.actor);
    setTurn((value) => value + 1);
    setMessage(`${text} ${reply.event.message}`);
  }

  function attack() {
    if (finished) return;
    const result = resolveBasicAttack(player, enemy, rules);
    complete(result.actor, result.target, result.event.message);
  }

  function handleSkill(skill: ClassSkill) {
    if (finished) return;
    const result = resolveSkill(player, enemy, skill, rules);
    if (result.event.kind === "error") {
      setMessage(result.event.message);
      return;
    }
    complete(result.actor, result.target, result.event.message);
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
      <div className="arena-actions">
        <button disabled={finished} onClick={attack} type="button">
          <strong>Ataque básico</strong>
          <span>1x FOR · sem custo</span>
        </button>
        {character.skills.map((skill) => {
          const cooldown = player.cooldowns[skill.key] ?? 0;
          const cannotPay = skill.resource === "mana" && player.mana < skill.cost;
          return (
            <button
              disabled={finished || cooldown > 0 || cannotPay}
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
      </div>
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
