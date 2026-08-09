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

export interface ArenaCharacter {
  id: string;
  name: string;
  raceName: string;
  className: string;
  level: number;
  baseHp: number;
  baseMana: number;
  attributes: CombatAttributes;
  skills: ClassSkill[];
}

interface LogEntry {
  id: number;
  turn: number;
  text: string;
  tone: "player" | "enemy" | "system";
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
  const initialId = characters.some((entry) => entry.id === initialCharacterId)
    ? initialCharacterId!
    : (characters[0]?.id ?? "");
  const [selectedId, setSelectedId] = useState(initialId);
  const selected = useMemo(
    () => characters.find((entry) => entry.id === selectedId) ?? characters[0],
    [characters, selectedId],
  );
  const initialBattle = useMemo(
    () => (selected ? createBattle(selected, rules) : null),
    [selected, rules],
  );
  const [battleKey, setBattleKey] = useState(0);
  const battle = initialBattle;
  if (!selected || !battle)
    return (
      <section className="arena-empty">
        <span>ARENA</span>
        <h1>Nenhum personagem disponível</h1>
        <p>Crie uma ficha antes de iniciar um combate de teste.</p>
      </section>
    );
  return (
    <ArenaBattle
      key={`${selected.id}-${battleKey}`}
      character={selected}
      initial={battle}
      onCharacterChange={(id) => {
        setSelectedId(id);
        setBattleKey((value) => value + 1);
      }}
      onReset={() => setBattleKey((value) => value + 1)}
      options={characters}
      rules={rules}
    />
  );
}

function ArenaBattle({
  character,
  initial,
  options,
  rules,
  onCharacterChange,
  onReset,
}: {
  character: ArenaCharacter;
  initial: { player: CombatantState; enemy: CombatantState };
  options: ArenaCharacter[];
  rules: CombatRules;
  onCharacterChange(id: string): void;
  onReset(): void;
}) {
  const [player, setPlayer] = useState(initial.player);
  const [enemy, setEnemy] = useState(initial.enemy);
  const [turn, setTurn] = useState(1);
  const [outcome, setOutcome] = useState<"playing" | "victory" | "defeat">("playing");
  const [log, setLog] = useState<LogEntry[]>([
    { id: 1, turn: 1, text: `${character.name} entrou na Arena de Testes.`, tone: "system" },
  ]);

  function emitSfx(name: string) {
    window.dispatchEvent(new CustomEvent("wonderland:sfx", { detail: name }));
  }
  function addLogs(entries: Array<Omit<LogEntry, "id" | "turn">>) {
    setLog((current) => [
      ...entries.map((entry, index) => ({ ...entry, id: Date.now() + index, turn })),
      ...current,
    ]);
  }

  function finishPlayerAction(
    nextPlayer: CombatantState,
    nextEnemy: CombatantState,
    message: string,
  ) {
    if (nextEnemy.hp <= 0) {
      setPlayer(nextPlayer);
      setEnemy(nextEnemy);
      setOutcome("victory");
      addLogs([
        { text: message, tone: "player" },
        { text: "Vitória! O boneco de treino foi derrotado.", tone: "system" },
      ]);
      emitSfx("confirm");
      return;
    }
    const retaliation = resolveBasicAttack(nextEnemy, nextPlayer, rules);
    const preparedPlayer = tickCooldowns(retaliation.target);
    setPlayer(preparedPlayer);
    setEnemy(retaliation.actor);
    setTurn((value) => value + 1);
    addLogs([
      { text: message, tone: "player" },
      { text: retaliation.event.message, tone: "enemy" },
    ]);
    if (preparedPlayer.hp <= 0) {
      setOutcome("defeat");
      emitSfx("error");
    }
  }

  function attack() {
    if (outcome !== "playing") return;
    const resolution = resolveBasicAttack(player, enemy, rules);
    finishPlayerAction(resolution.actor, resolution.target, resolution.event.message);
  }
  function handleSkill(skill: ClassSkill) {
    if (outcome !== "playing") return;
    const resolution = resolveSkill(player, enemy, skill, rules);
    if (resolution.event.kind === "error") {
      addLogs([{ text: resolution.event.message, tone: "system" }]);
      emitSfx("error");
      return;
    }
    finishPlayerAction(resolution.actor, resolution.target, resolution.event.message);
  }

  return (
    <div className="arena-console">
      <header className="arena-toolbar">
        <div>
          <span className="eyebrow">Simulação local · sem recompensas</span>
          <h1>Arena de Testes</h1>
        </div>
        <label>
          Personagem
          <select value={character.id} onChange={(event) => onCharacterChange(event.target.value)}>
            {options.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name} · {entry.className}
              </option>
            ))}
          </select>
        </label>
        <div className="arena-turn">
          <span>Turno</span>
          <strong>{turn}</strong>
        </div>
      </header>
      <section className="arena-stage">
        <FighterCard
          combatant={player}
          label={`${character.raceName} · ${character.className}`}
          side="player"
        />
        <div className="arena-versus">
          <span>VS</span>
          <small>
            {outcome === "playing" ? "Em combate" : outcome === "victory" ? "Vitória" : "Derrota"}
          </small>
        </div>
        <FighterCard combatant={enemy} label="Monstro de treinamento" side="enemy" />
      </section>
      <section className="arena-controls">
        <div className="arena-actions">
          <header>
            <div>
              <span className="eyebrow">Ações disponíveis</span>
              <h2>Escolha seu movimento</h2>
            </div>
            {outcome !== "playing" ? (
              <button className="button button--primary" onClick={onReset} type="button">
                Reiniciar combate
              </button>
            ) : null}
          </header>
          <div className="arena-skill-grid">
            <button
              className="arena-skill-button"
              disabled={outcome !== "playing"}
              onClick={attack}
              type="button"
            >
              <span>Ataque</span>
              <strong>Ataque básico</strong>
              <p>1x FOR como dano físico.</p>
              <small>Sem custo · sem recarga</small>
            </button>
            {character.skills.map((skill) => {
              const cooldown = player.cooldowns[skill.key] ?? 0;
              const cannotPay = skill.resource === "mana" && player.mana < skill.cost;
              return (
                <button
                  className="arena-skill-button"
                  disabled={outcome !== "playing" || cooldown > 0 || cannotPay}
                  key={skill.key}
                  onClick={() => handleSkill(skill)}
                  type="button"
                >
                  <span>
                    Nível {skill.level} · {skill.category}
                  </span>
                  <strong>{skill.name}</strong>
                  <p>{skill.effect}</p>
                  <small>
                    {skill.cost > 0
                      ? `${skill.cost} ${skill.resource === "mana" ? "Mana" : "HP"}`
                      : "Sem custo"}{" "}
                    ·{" "}
                    {cooldown > 0
                      ? `${cooldown} turno(s) de recarga`
                      : skill.cooldown > 0
                        ? `Recarga ${skill.cooldown}`
                        : "Sem recarga"}
                  </small>
                </button>
              );
            })}
          </div>
        </div>
        <aside className="arena-log">
          <header>
            <span className="eyebrow">Registro de combate</span>
            <h2>Últimas ações</h2>
          </header>
          <ol>
            {log.map((entry) => (
              <li className={`is-${entry.tone}`} key={entry.id}>
                <span>T{entry.turn}</span>
                <p>{entry.text}</p>
              </li>
            ))}
          </ol>
        </aside>
      </section>
      <footer className="arena-disclaimer">
        Esta Arena é um ambiente de testes. HP, Mana, XP, itens e resultados não são salvos na ficha
        real.
      </footer>
    </div>
  );
}

function FighterCard({
  combatant,
  label,
  side,
}: {
  combatant: CombatantState;
  label: string;
  side: "player" | "enemy";
}) {
  const hpPercent = Math.max(0, (combatant.hp / combatant.maxHp) * 100);
  const manaPercent =
    combatant.maxMana > 0 ? Math.max(0, (combatant.mana / combatant.maxMana) * 100) : 0;
  return (
    <article className={`arena-fighter is-${side}`}>
      <div className="arena-fighter__portrait">
        <span>{combatant.name.slice(0, 2).toUpperCase()}</span>
      </div>
      <span className="eyebrow">{label}</span>
      <h2>{combatant.name}</h2>
      <div className="arena-resource">
        <div>
          <span>HP</span>
          <strong>
            {combatant.hp} / {combatant.maxHp}
          </strong>
        </div>
        <div className="arena-resource__bar is-hp">
          <span style={{ width: `${hpPercent}%` }} />
        </div>
      </div>
      <div className="arena-resource">
        <div>
          <span>Mana</span>
          <strong>
            {combatant.mana} / {combatant.maxMana}
          </strong>
        </div>
        <div className="arena-resource__bar is-mana">
          <span style={{ width: `${manaPercent}%` }} />
        </div>
      </div>
      {combatant.shield > 0 ? (
        <span className="arena-shield">Escudo {combatant.shield}</span>
      ) : null}
    </article>
  );
}

function createBattle(character: ArenaCharacter, rules: CombatRules) {
  const player = createCombatant({
    id: character.id,
    name: character.name,
    attributes: character.attributes,
    baseHp: character.baseHp,
    baseMana: character.baseMana,
    rules,
  });
  const enemyAttributes: CombatAttributes = {
    FOR: Math.max(35, Math.round(character.attributes.FOR * 0.55)),
    DEF: Math.max(25, Math.round(character.attributes.DEF * 0.65)),
    RES: Math.max(25, Math.round(character.attributes.RES * 0.65)),
    INI: Math.max(20, character.attributes.INI - 10),
    INT: 20,
    ARC: 0,
  };
  const derivedEnemy = createCombatant({
    id: "training-dummy",
    name: "Boneco Rúnico",
    attributes: enemyAttributes,
    baseHp: Math.max(450, Math.round(player.maxHp * 0.7)),
    baseMana: 0,
    rules,
  });
  return { player, enemy: derivedEnemy };
}
