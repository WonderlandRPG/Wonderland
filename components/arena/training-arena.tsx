"use client";

import { useMemo, useState } from "react";

import {
  createCombatant,
  getRaceAbilityCooldown,
  getRaceAbilityArenaMeta,
  resolveBasicAttack,
  resolveRaceAbility,
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
  imageUrl: string;
  raceName: string;
  className: string;
  baseHp: number;
  baseMana: number;
  classResource: {
    name: string;
    initial: number;
    maximum: number;
    generationEvents?: Array<{ trigger: string; amount: number }>;
  };
  raceResource: {
    name: string;
    initial: number;
    maximum: number;
    generationEvents?: Array<{ trigger: string; amount: number }>;
  } | null;
  attributes: CombatAttributes;
  skills: ClassSkill[];
  raceAbilities: ClassSkill[];
  items: Array<{ id: string; name: string; description: string }>;
  combatLore: Array<{ name: string; description: string }>;
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

  function handleRaceAbility(ability: ClassSkill) {
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
      <header className="arena-toolbar arena-game-header">
        <div>
          <span className="eyebrow">Campo de treinamento</span>
          <h1>Duelo de Arena</h1>
          <p>Use até uma ação de cada grupo antes de encerrar a rodada.</p>
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
        <strong className="arena-turn-counter"><small>Rodada atual</small>{String(turn).padStart(2, "0")}</strong>
      </header>
      <div className="arena-stage arena-duel-board">
        <Fighter combatant={player} imageUrl={character.imageUrl} side="player" subtitle={`${character.raceName} · ${character.className}`} />
        <div className="arena-versus"><small>Rodada {turn}</small><b>VS</b><span>Treino</span></div>
        <Fighter combatant={enemy} imageUrl="" side="enemy" subtitle="Autômato de treino" />
      </div>
      <p className="arena-message" role="status">
        <span>Registro de combate</span>{message}
      </p>
      <div className="arena-turn-budget" aria-label="Ações desta rodada">
        <span className={actions.basic ? "is-used" : ""}>Ataque {actions.basic ? "✓" : "1"}</span>
        <span className={actions.race ? "is-used" : ""}>Raça {actions.race ? "✓" : "1"}</span>
        <span className={actions.class ? "is-used" : ""}>Classe {actions.class ? "✓" : "1"}</span>
        <span className={actions.item ? "is-used" : ""}>Item {actions.item ? "✓" : "1"}</span>
      </div>
      <section className="arena-effects">
        <header>
          <span className="eyebrow">Efeitos permanentes aplicados</span>
          <strong>Passivas e mecânicas ativas</strong>
        </header>
        <div>
          {character.combatLore.slice(0, 6).map((entry) => (
            <article key={entry.name}>
              <b>{entry.name}</b>
              <span>{combatModifierLabel(entry.description)}</span>
            </article>
          ))}
        </div>
      </section>
      <section className="arena-command-panel">
        <header><div><span className="eyebrow">Comandos disponíveis</span><h2>Escolha suas ações</h2></div><small>1 ação de cada categoria por rodada</small></header>
      <div className="arena-actions">
        <button data-action="basic" data-action-label="Ataque" disabled={finished || actions.basic} onClick={attack} type="button">
          <em className="arena-skill-origin"><i>⚔</i>Ação básica</em>
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
          const meta = getRaceAbilityArenaMeta(ability);
          const raceCannotPay =
            ability.resource === "special" && player.raceResource < ability.cost;
          return (
            <button
              data-action="race"
              data-action-label="Raça"
              disabled={finished || actions.race || cooldown > 0 || raceCannotPay}
              key={ability.key}
              onClick={() => handleRaceAbility(ability)}
              type="button"
            >
              <em className="arena-skill-origin"><i>✦</i>Habilidade racial</em>
              <strong>{ability.name}</strong>
              <span>{meta.summary}</span>
              <small>
                {cooldown
                  ? `Recarga: ${cooldown} rodada(s)`
                  : `${meta.cost} ${ability.resource === "special" ? player.raceResourceName : "Mana"} · Recarga ${meta.cooldown}`}
              </small>
            </button>
          );
        })}
        {character.skills.map((skill) => {
          const cooldown = player.cooldowns[skill.key] ?? 0;
          const cannotPay = skill.resource === "mana" && player.mana < skill.cost;
          const cannotPayClassResource =
            skill.resource === "special" &&
            (skill.resourceKey === "race" ? player.raceResource : player.classResource) < skill.cost;
          return (
            <button
              data-action="class"
              data-action-label="Classe"
              disabled={
                finished || actions.class || cooldown > 0 || cannotPay || cannotPayClassResource
              }
              key={skill.key}
              onClick={() => handleSkill(skill)}
              type="button"
            >
              <em className="arena-skill-origin"><i>◆</i>Habilidade de classe</em>
              <strong>{skill.name}</strong>
              <span>{skill.effect}</span>
              <small>
                {cooldown
                  ? `Recarga: ${cooldown}`
                  : `${skill.cost} ${skill.resource === "mana" ? "Mana" : skill.resource === "special" ? (skill.resourceKey === "race" ? player.raceResourceName : player.classResourceName) : "HP"} · Recarga ${skill.cooldown}`}
              </small>
            </button>
          );
        })}
        {character.items.length ? (
          character.items.map((item) => (
            <button
              data-action="item"
              data-action-label="Item"
              disabled={finished || actions.item}
              key={item.id}
              onClick={() => handleItem(item)}
              type="button"
            >
              <em className="arena-skill-origin"><i>◈</i>Item equipado</em>
              <strong>{item.name}</strong>
              <span>{item.description}</span>
              <small>Item consumível</small>
            </button>
          ))
        ) : (
          <button data-action="item" data-action-label="Item" disabled type="button">
            <em className="arena-skill-origin"><i>◈</i>Item equipado</em>
            <strong>Item</strong>
            <span>Nenhum consumível no inventário.</span>
          </button>
        )}
      </div>
      </section>
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

function Fighter({ combatant, subtitle, side, imageUrl }: { combatant: CombatantState; subtitle: string; side: "player" | "enemy"; imageUrl: string }) {
  return (
    <article className={`arena-fighter is-${side}`}>
      <div className={`arena-fighter__portrait ${imageUrl ? "is-image" : ""}`} style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}>
        {imageUrl ? "" : side === "player" ? combatant.name.slice(0, 2).toUpperCase() : "鬼"}
        <span>{side === "player" ? "JOGADOR" : "OPONENTE"}</span>
      </div>
      <div className="arena-fighter__status">
      <span className="eyebrow">{subtitle}</span>
      <h2>{combatant.name}</h2>
      <p>
        HP{" "}
        <strong>
          {combatant.hp}/{combatant.maxHp}
        </strong>
      </p>
      <progress className="is-hp" max={combatant.maxHp} value={combatant.hp} />
      <p>
        Mana{" "}
        <strong>
          {combatant.mana}/{combatant.maxMana}
        </strong>
      </p>
      <progress className="is-mana" max={combatant.maxMana || 1} value={combatant.mana} />
      {combatant.maxClassResource > 0 ? (
        <>
          <p>
            {combatant.classResourceName}{" "}
            <strong>
              {combatant.classResource}/{combatant.maxClassResource}
            </strong>
          </p>
          <progress className="is-class-resource" max={combatant.maxClassResource} value={combatant.classResource} />
        </>
      ) : null}
      {combatant.maxRaceResource > 0 ? (
        <>
          <p>
            {combatant.raceResourceName}{" "}
            <strong>
              {combatant.raceResource}/{combatant.maxRaceResource}
            </strong>
          </p>
          <progress className="is-race-resource" max={combatant.maxRaceResource} value={combatant.raceResource} />
        </>
      ) : null}
      {combatant.shield > 0 ? <small>Escudo: {combatant.shield}</small> : null}
      </div>
    </article>
  );
}

function createBattle(character: ArenaCharacter, rules: CombatRules) {
  const text = character.combatLore
    .map((entry) => `${entry.name} ${entry.description}`)
    .join(" ")
    .toLowerCase();
  const attributes = { ...character.attributes };
  if (/dano|ofensiv|ataque/.test(text)) {
    attributes.FOR = Math.round(attributes.FOR * 1.08);
    attributes.INT = Math.round(attributes.INT * 1.08);
  }
  if (/prote|resist|defesa|reduz.*dano/.test(text)) {
    attributes.DEF = Math.round(attributes.DEF * 1.08);
    attributes.RES = Math.round(attributes.RES * 1.08);
  }
  if (/cura|escudo|suporte/.test(text)) attributes.ARC = Math.round(attributes.ARC * 1.1);
  if (/mana|arcano|magia/.test(text)) attributes.INT = Math.round(attributes.INT * 1.05);
  const player = createCombatant({ ...character, attributes, rules });
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

function combatModifierLabel(description: string) {
  const text = description.toLowerCase();
  const effects = [];
  if (/dano|ofensiv|ataque/.test(text)) effects.push("Poder ofensivo +8%");
  if (/prote|resist|defesa|reduz.*dano/.test(text)) effects.push("DEF e RES +8%");
  if (/cura|escudo|suporte/.test(text)) effects.push("ARC +10%");
  if (/mana|arcano|magia/.test(text)) effects.push("INT +5%");
  return effects.join(" · ") || "Regra narrativa ativa na ficha";
}
