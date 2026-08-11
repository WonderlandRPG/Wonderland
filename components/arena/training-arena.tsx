"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { claimArenaVictoryAction } from "@/app/arena/actions";

import {
  createCombatant,
  getRaceAbilityCooldown,
  getRaceAbilityArenaMeta,
  getEffectiveAttributes,
  guardCombatant,
  resolveBasicAttack,
  resolveRaceAbility,
  resolveSkill,
  tickCooldowns,
  type CombatAttributes,
  type CombatRules,
  type CombatantState,
} from "@/lib/game/combat";
import type { ClassSkill } from "@/lib/game/classes";
import {
  arenaMonsters,
  arenaRewards,
  buildAdaptiveMonsterAttributes,
  getMovementRange,
  tacticalGrid,
  type ArenaMode,
} from "@/lib/game/arena";
import {
  applyBattleStartItemEffects,
  resolvePeriodicItemDamage,
  sumItemEffectModifiers,
  type ItemSpecialEffect,
} from "@/lib/game/item-effects";

interface ArenaCharacter {
  id: string;
  name: string;
  level: number;
  adventureRank: string;
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
  usesMana: boolean;
  basicAttackRange: number;
  attributes: CombatAttributes;
  skills: ClassSkill[];
  raceAbilities: ClassSkill[];
  items: Array<{ id: string; name: string; description: string }>;
  combatLore: Array<{ name: string; description: string }>;
  equipmentEffects: ItemSpecialEffect[];
}

type TurnActions = {
  move: boolean;
  basic: boolean;
  race: boolean;
  class: boolean;
  item: boolean;
  defend: boolean;
};
type Position = { x: number; y: number };
const freshActions: TurnActions = {
  move: false,
  basic: false,
  race: false,
  class: false,
  item: false,
  defend: false,
};
const turnDuration = 60;

function gridDistance(left: Position, right: Position) {
  return Math.abs(left.x - right.x) + Math.abs(left.y - right.y);
}

function stepToward(from: Position, target: Position, maximum: number) {
  const next = { ...from };
  for (let step = 0; step < maximum && gridDistance(next, target) > 1; step += 1) {
    if (next.x !== target.x) next.x += Math.sign(target.x - next.x);
    else if (next.y !== target.y) next.y += Math.sign(target.y - next.y);
  }
  return next;
}

export function TrainingArena({
  characters,
  initialCharacterId,
  rules,
  mode,
  monsterIndex,
  sessionId,
  opponent,
}: {
  characters: ArenaCharacter[];
  initialCharacterId?: string;
  rules: CombatRules;
  mode: ArenaMode;
  monsterIndex: number;
  sessionId?: string;
  opponent?: ArenaCharacter;
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
      mode={mode}
      monsterIndex={monsterIndex}
      sessionId={sessionId}
      opponent={opponent}
      onChange={setSelectedId}
      onReset={() => setResetKey((value) => value + 1)}
    />
  );
}

function Battle({
  character,
  options,
  rules,
  mode,
  monsterIndex,
  sessionId,
  opponent,
  onChange,
  onReset,
}: {
  character: ArenaCharacter;
  options: ArenaCharacter[];
  rules: CombatRules;
  mode: ArenaMode;
  monsterIndex: number;
  sessionId?: string;
  opponent?: ArenaCharacter;
  onChange(id: string): void;
  onReset(): void;
}) {
  const initial = useMemo(
    () => createBattle(character, rules, mode, monsterIndex, opponent),
    [character, rules, mode, monsterIndex, opponent],
  );
  const [player, setPlayer] = useState(initial.player);
  const [enemy, setEnemy] = useState(initial.enemy);
  const [turn, setTurn] = useState(1);
  const [actions, setActions] = useState<TurnActions>(freshActions);
  const [newCooldowns, setNewCooldowns] = useState<string[]>([]);
  const [playerPosition, setPlayerPosition] = useState<Position>({ x: 1, y: 7 });
  const [enemyPosition, setEnemyPosition] = useState<Position>({ x: 18, y: 7 });
  const [moving, setMoving] = useState(false);
  const [timeLeft, setTimeLeft] = useState(turnDuration);
  const [message, setMessage] = useState("Escolha sua primeira ação.");
  const [reward, setReward] = useState<{ xp: number; wg: number } | null>(null);
  const [rewardError, setRewardError] = useState("");
  const [claiming, startClaim] = useTransition();
  const finished = player.hp <= 0 || enemy.hp <= 0;
  const playerMovementRange = getMovementRange(getEffectiveAttributes(player).INI);
  const rankReward =
    arenaRewards[character.adventureRank as keyof typeof arenaRewards] ?? arenaRewards.E;
  function claimReward() {
    if (!sessionId) {
      setRewardError(
        "Esta batalha não foi registrada. Volte aos modos da Arena e inicie um novo combate.",
      );
      return;
    }
    if (reward || claiming) return;
    startClaim(async () => {
      const result = await claimArenaVictoryAction(sessionId);
      if (result.ok) setReward({ xp: result.xp, wg: result.wg });
      else setRewardError(result.message);
    });
  }

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

  const finishTurn = useCallback(
    (timedOut = false) => {
      if (finished || (!timedOut && !Object.values(actions).some(Boolean))) return;
      const enemyMovementRange = getMovementRange(getEffectiveAttributes(enemy).INI);
      const nextEnemyPosition = stepToward(enemyPosition, playerPosition, enemyMovementRange);
      const enemyCanAttack = gridDistance(nextEnemyPosition, playerPosition) <= 1;
      const reply = enemyCanAttack
        ? resolveBasicAttack(enemy, player, rules)
        : {
            actor: enemy,
            target: player,
            event: {
              kind: "utility" as const,
              amount: 0,
              message: `${enemy.name} avançou pelo campo de batalha.`,
            },
          };
      const playerPeriodic = resolvePeriodicItemDamage(reply.target);
      const enemyPeriodic = resolvePeriodicItemDamage(reply.actor);
      const cooledPlayer = tickCooldowns(playerPeriodic.combatant);
      const cooledEnemy = tickCooldowns(enemyPeriodic.combatant);
      for (const key of newCooldowns)
        cooledPlayer.cooldowns[key] = reply.target.cooldowns[key] ?? 0;
      setPlayer(cooledPlayer);
      setEnemy(cooledEnemy);
      setEnemyPosition(nextEnemyPosition);
      setTurn((value) => value + 1);
      setActions(freshActions);
      setMoving(false);
      setNewCooldowns([]);
      setTimeLeft(turnDuration);
      setMessage(
        reply.target.hp <= 0
          ? `${reply.event.message} Você foi derrotado.`
          : timedOut
            ? `O tempo acabou. ${reply.event.message}`
            : `${reply.event.message}${[...playerPeriodic.messages, ...enemyPeriodic.messages].length ? ` ${[...playerPeriodic.messages, ...enemyPeriodic.messages].join(" ")}` : ""} Nova rodada: escolha suas ações.`,
      );
    },
    [actions, enemy, enemyPosition, finished, newCooldowns, player, playerPosition, rules],
  );

  useEffect(() => {
    if (finished) return;
    const timer = window.setInterval(
      () =>
        setTimeLeft((value) => {
          if (value === 1) window.setTimeout(() => finishTurn(true), 0);
          return Math.max(0, value - 1);
        }),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [finishTurn, finished, turn]);

  function attack() {
    if (finished || actions.basic || actions.defend) return;
    if (gridDistance(playerPosition, enemyPosition) > character.basicAttackRange) {
      setMessage(
        `O alvo está fora do alcance do ataque básico (${character.basicAttackRange} casa(s)).`,
      );
      return;
    }
    const result = resolveBasicAttack(player, enemy, rules);
    applyPlayerAction(result.actor, result.target, result.event.message, "basic");
  }

  function handleSkill(skill: ClassSkill) {
    if (finished || actions.class || actions.defend) return;
    if (skill.target !== "self" && gridDistance(playerPosition, enemyPosition) > skill.range) {
      setMessage(`${skill.name} alcança ${skill.range} casa(s). Aproxime-se do alvo.`);
      return;
    }
    const result = resolveSkill(player, enemy, skill, rules);
    if (result.event.kind === "error") {
      setMessage(result.event.message);
      return;
    }
    applyPlayerAction(result.actor, result.target, result.event.message, "class");
  }

  function handleRaceAbility(ability: ClassSkill) {
    if (finished || actions.race || actions.defend) return;
    if (ability.target !== "self" && gridDistance(playerPosition, enemyPosition) > ability.range) {
      setMessage(`${ability.name} alcança ${ability.range} casa(s). Aproxime-se do alvo.`);
      return;
    }
    const result = resolveRaceAbility(player, enemy, ability, rules);
    if (result.event.kind === "error") return setMessage(result.event.message);
    applyPlayerAction(result.actor, result.target, result.event.message, "race");
  }

  function handleItem(item: ArenaCharacter["items"][number]) {
    if (finished || actions.item || actions.defend) return;
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

  function moveTo(position: Position) {
    if (!moving || actions.move || actions.defend || finished) return;
    if (gridDistance(playerPosition, position) > playerMovementRange) return;
    if (position.x === enemyPosition.x && position.y === enemyPosition.y) return;
    setPlayerPosition(position);
    setActions((current) => ({ ...current, move: true }));
    setMoving(false);
    setMessage(`${character.name} moveu-se para outra posição do mapa.`);
  }

  function defend() {
    const hasAnotherAction =
      actions.move || actions.basic || actions.race || actions.class || actions.item;
    if (finished || hasAnotherAction || (player.cooldowns["defesa-total"] ?? 0) > 0) return;
    const guarded = guardCombatant(player);
    setPlayer(guarded);
    setNewCooldowns((current) => [...new Set([...current, "defesa-total"])]);
    setActions((current) => ({ ...current, defend: true }));
    setMoving(false);
    setMessage(`${character.name} assumiu postura defensiva e bloqueará o próximo dano.`);
  }

  return (
    <section className="arena-console">
      <header className="arena-toolbar arena-game-header">
        <div>
          <span className="eyebrow">
            {mode === "pve"
              ? "Expedição PvE"
              : mode === "pvp"
                ? "Confronto PvP"
                : "Campo de treinamento"}
          </span>
          <h1>
            {mode === "pve"
              ? initial.title
              : mode === "pvp"
                ? `Duelo contra ${initial.enemy.name}`
                : "Duelo de Arena"}
          </h1>
          <p>Monte sua jogada, mova-se pelo mapa e encerre o turno.</p>
        </div>
        {options.length > 1 ? (
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
        ) : (
          <div className="arena-selected-fighter">
            <small>Personagem</small>
            <strong>{character.name}</strong>
            <span>
              {character.raceName} · {character.className}
            </span>
          </div>
        )}
        <strong className={`arena-turn-timer ${timeLeft <= 10 ? "is-ending" : ""}`}>
          <small>Tempo do turno</small>
          {String(timeLeft).padStart(2, "0")}s
        </strong>
        <strong className="arena-turn-counter">
          <small>Rodada atual</small>
          {String(turn).padStart(2, "0")}
        </strong>
      </header>
      <div className="arena-battlefield-shell">
        <Fighter
          combatant={player}
          imageUrl={character.imageUrl}
          side="player"
          subtitle={`${character.raceName} · ${character.className}`}
        />
        <BattleGrid
          enemy={enemy}
          enemyPosition={enemyPosition}
          movementRange={playerMovementRange}
          moving={moving}
          onMove={moveTo}
          player={player}
          playerPosition={playerPosition}
        />
        <Fighter
          combatant={enemy}
          imageUrl={opponent?.imageUrl ?? ""}
          side="enemy"
          sigil={initial.sigil}
          subtitle={`Nível ${opponent?.level ?? character.level} · ${initial.title}`}
        />
      </div>
      <p className="arena-message" role="status">
        <span>Combate</span>
        {message}
      </p>
      <div className="arena-turn-budget" aria-label="Ações desta rodada">
        <span className={actions.move ? "is-used" : ""}>Movimento {actions.move ? "✓" : "1"}</span>
        <span className={actions.basic ? "is-used" : ""}>Ataque {actions.basic ? "✓" : "1"}</span>
        <span className={actions.race ? "is-used" : ""}>Raça {actions.race ? "✓" : "1"}</span>
        <span className={actions.class ? "is-used" : ""}>Classe {actions.class ? "✓" : "1"}</span>
        <span className={actions.defend ? "is-used" : ""}>Defesa {actions.defend ? "✓" : "1"}</span>
      </div>
      <section className="arena-command-panel">
        <header>
          <div>
            <span className="eyebrow">Comandos disponíveis</span>
            <h2>Escolha suas ações</h2>
          </div>
          <small>1 ação de cada categoria por rodada</small>
        </header>
        <div className="arena-actions">
          <section className="arena-action-group" data-action="basic">
            <header>
              <span>⚔</span>
              <strong>Ações básicas</strong>
            </header>
            <button
              className={moving ? "is-selected" : ""}
              data-action="basic"
              data-action-label="Movimento"
              disabled={finished || actions.move || actions.defend}
              onClick={() => setMoving((value) => !value)}
              type="button"
            >
              <em className="arena-skill-origin">
                <i>⌖</i>Movimentação
              </em>
              <strong>{moving ? "Escolha uma casa" : "Mover"}</strong>
              <span>Avance até {playerMovementRange} casas conforme sua INI.</span>
            </button>
            <button
              data-action="basic"
              data-action-label="Defesa"
              disabled={
                finished ||
                actions.move ||
                actions.basic ||
                actions.race ||
                actions.class ||
                actions.item ||
                (player.cooldowns["defesa-total"] ?? 0) > 0
              }
              onClick={defend}
              type="button"
            >
              <em className="arena-skill-origin">
                <i>◈</i>Ação defensiva
              </em>
              <strong>Defender</strong>
              <span>Abdique dos ataques para bloquear 100% do próximo dano.</span>
              <small>
                {(player.cooldowns["defesa-total"] ?? 0) > 0
                  ? `Recarga: ${player.cooldowns["defesa-total"]} rodada(s)`
                  : "Recarga: 5 rodadas"}
              </small>
            </button>
            <button
              data-action="basic"
              data-action-label="Ataque"
              disabled={finished || actions.basic || actions.defend}
              onClick={attack}
              type="button"
            >
              <em className="arena-skill-origin">
                <i>⚔</i>Ação básica
              </em>
              <strong>Ataque básico</strong>
              <span>
                1x{" "}
                {player.attributes.INT > player.attributes.FOR
                  ? "INT · dano mágico"
                  : "FOR · dano físico"}{" "}
                · alcance {character.basicAttackRange}
              </span>
            </button>
            <button
              className="arena-end-turn"
              data-action="basic"
              data-action-label="Turno"
              disabled={finished || !Object.values(actions).some(Boolean)}
              onClick={() => finishTurn(false)}
              type="button"
            >
              <em className="arena-skill-origin">
                <i>✓</i>Controle da rodada
              </em>
              <strong>Encerrar turno</strong>
              <span>Confirma as ações e entrega o turno ao adversário.</span>
            </button>
          </section>
          <section className="arena-action-group" data-action="race">
            <header>
              <span>✦</span>
              <strong>Habilidades da raça</strong>
            </header>
            {character.raceAbilities.map((ability) => {
              const cooldown = getRaceAbilityCooldown(player, ability);
              const meta = getRaceAbilityArenaMeta(ability);
              const raceCannotPay =
                ability.resource === "special" && player.raceResource < ability.cost;
              return (
                <button
                  data-action="race"
                  data-action-label="Raça"
                  disabled={
                    finished || actions.race || actions.defend || cooldown > 0 || raceCannotPay
                  }
                  key={ability.key}
                  onClick={() => handleRaceAbility(ability)}
                  type="button"
                >
                  <em className="arena-skill-origin">
                    <i>✦</i>Habilidade racial
                  </em>
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
            {!character.raceAbilities.length ? (
              <p>Nenhuma habilidade racial desbloqueada.</p>
            ) : null}
          </section>
          <section className="arena-action-group" data-action="class">
            <header>
              <span>◆</span>
              <strong>Habilidades da classe</strong>
            </header>
            {character.skills.map((skill) => {
              const cooldown = player.cooldowns[skill.key] ?? 0;
              const cannotPay = skill.resource === "mana" && player.mana < skill.cost;
              const cannotPayClassResource =
                skill.resource === "special" &&
                (skill.resourceKey === "race" ? player.raceResource : player.classResource) <
                  skill.cost;
              return (
                <button
                  data-action="class"
                  data-action-label="Classe"
                  disabled={
                    finished ||
                    actions.class ||
                    actions.defend ||
                    cooldown > 0 ||
                    cannotPay ||
                    cannotPayClassResource
                  }
                  key={skill.key}
                  onClick={() => handleSkill(skill)}
                  type="button"
                >
                  <em className="arena-skill-origin">
                    <i>◆</i>Habilidade de classe
                  </em>
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
            {!character.skills.length ? <p>Nenhuma habilidade de classe desbloqueada.</p> : null}
          </section>
          <section className="arena-action-group" data-action="item">
            <header>
              <span>◇</span>
              <strong>Itens</strong>
            </header>
            {character.items.length ? (
              character.items.map((item) => (
                <button
                  data-action="item"
                  data-action-label="Item"
                  disabled={finished || actions.item || actions.defend}
                  key={item.id}
                  onClick={() => handleItem(item)}
                  type="button"
                >
                  <em className="arena-skill-origin">
                    <i>◈</i>Item equipado
                  </em>
                  <strong>{item.name}</strong>
                  <span>{item.description}</span>
                  <small>Item consumível</small>
                </button>
              ))
            ) : (
              <button data-action="item" data-action-label="Item" disabled type="button">
                <em className="arena-skill-origin">
                  <i>◈</i>Item equipado
                </em>
                <strong>Item</strong>
                <span>Nenhum consumível no inventário.</span>
              </button>
            )}
          </section>
        </div>
      </section>
      {finished ? (
        <section className={`arena-result ${enemy.hp <= 0 ? "is-victory" : "is-defeat"}`}>
          <span>{enemy.hp <= 0 ? "VITÓRIA" : "DERROTA"}</span>
          <h2>
            {enemy.hp <= 0 ? `${initial.title} foi derrotado` : "Seu personagem caiu em combate"}
          </h2>
          <p>
            {enemy.hp <= 0
              ? "Sua sequência dominou o confronto."
              : "Revise sua ordem de ações, atributos e equipamentos antes de tentar novamente."}
          </p>
          {enemy.hp <= 0 && mode === "pve" ? (
            <div>
              <strong>+{rankReward.xp.toLocaleString("pt-BR")} XP</strong>
              <strong>+{rankReward.wg.toLocaleString("pt-BR")} WG</strong>
              <small>
                {reward ? "Recompensa recebida" : `Recompensa do Rank ${character.adventureRank}`}
              </small>
            </div>
          ) : null}
          {enemy.hp <= 0 && mode === "pve" && !reward ? (
            <button
              className="button button--primary"
              disabled={claiming}
              onClick={claimReward}
              type="button"
            >
              {claiming ? "Entregando…" : "Receber recompensa"}
            </button>
          ) : null}
          {rewardError ? <small className="arena-result__error">{rewardError}</small> : null}
          <button className="button button--primary" onClick={onReset} type="button">
            Lutar novamente
          </button>
        </section>
      ) : null}
    </section>
  );
}

function Fighter({
  combatant,
  subtitle,
  side,
  imageUrl,
  sigil = "鬼",
}: {
  combatant: CombatantState;
  subtitle: string;
  side: "player" | "enemy";
  imageUrl: string;
  sigil?: string;
}) {
  const effectiveAttributes = getEffectiveAttributes(combatant);
  return (
    <article className={`arena-fighter is-${side}`}>
      <div
        className={`arena-fighter__portrait ${imageUrl ? "is-image" : ""}`}
        style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}
      >
        {imageUrl ? "" : side === "player" ? combatant.name.slice(0, 2).toUpperCase() : sigil}
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
        {combatant.maxMana > 0 ? (
          <>
            <p>
              Mana{" "}
              <strong>
                {combatant.mana}/{combatant.maxMana}
              </strong>
            </p>
            <progress className="is-mana" max={combatant.maxMana} value={combatant.mana} />
          </>
        ) : null}
        {combatant.maxClassResource > 0 ? (
          <>
            <p>
              {combatant.classResourceName}{" "}
              <strong>
                {combatant.classResource}/{combatant.maxClassResource}
              </strong>
            </p>
            <progress
              className="is-class-resource"
              max={combatant.maxClassResource}
              value={combatant.classResource}
            />
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
            <progress
              className="is-race-resource"
              max={combatant.maxRaceResource}
              value={combatant.raceResource}
            />
          </>
        ) : null}
        {combatant.shield > 0 ? <small>Escudo: {combatant.shield}</small> : null}
        <div className="arena-status-icons" aria-label="Efeitos temporários">
          {Object.entries(combatant.statuses).map(([key, status]) => (
            <span
              className={status.beneficial ? "is-buff" : "is-debuff"}
              key={key}
              title={status.name}
            >
              <b>{status.beneficial ? "▲" : "▼"}</b>
              <small>{status.name}</small>
              <i>{status.duration}</i>
            </span>
          ))}
        </div>
        <AttributePanel base={combatant.attributes} current={effectiveAttributes} />
      </div>
    </article>
  );
}

function AttributePanel({ base, current }: { base: CombatAttributes; current: CombatAttributes }) {
  return (
    <details className="arena-attributes" open>
      <summary>Atributos em combate</summary>
      <div>
        {(Object.keys(base) as Array<keyof CombatAttributes>).map((attribute) => {
          const difference = current[attribute] - base[attribute];
          return (
            <span
              className={difference > 0 ? "is-boosted" : difference < 0 ? "is-reduced" : ""}
              key={attribute}
            >
              <b>{attribute}</b>
              <strong>{current[attribute]}</strong>
              {difference ? (
                <small>
                  {difference > 0 ? "+" : ""}
                  {difference}
                </small>
              ) : null}
            </span>
          );
        })}
      </div>
    </details>
  );
}

function BattleGrid({
  enemy,
  enemyPosition,
  movementRange,
  moving,
  onMove,
  player,
  playerPosition,
}: {
  enemy: CombatantState;
  enemyPosition: Position;
  movementRange: number;
  moving: boolean;
  onMove(position: Position): void;
  player: CombatantState;
  playerPosition: Position;
}) {
  const cells = Array.from({ length: tacticalGrid.width * tacticalGrid.height }, (_, index) => ({
    x: index % tacticalGrid.width,
    y: Math.floor(index / tacticalGrid.width),
  }));
  return (
    <section
      className={`arena-map ${moving ? "is-moving" : ""}`}
      aria-label="Mapa tático de combate"
    >
      <header>
        <span>Mapa de movimentação</span>
        <small>
          {moving
            ? `Escolha uma casa até ${movementRange} espaços`
            : `Distância: ${gridDistance(playerPosition, enemyPosition)} casas`}
        </small>
      </header>
      <div
        className="arena-map__grid"
        style={
          {
            "--arena-grid-width": tacticalGrid.width,
            "--arena-grid-height": tacticalGrid.height,
          } as React.CSSProperties
        }
      >
        {cells.map((position) => {
          const hasPlayer = position.x === playerPosition.x && position.y === playerPosition.y;
          const hasEnemy = position.x === enemyPosition.x && position.y === enemyPosition.y;
          const reachable =
            moving &&
            !hasPlayer &&
            !hasEnemy &&
            gridDistance(playerPosition, position) <= movementRange;
          return (
            <button
              aria-label={
                hasPlayer
                  ? player.name
                  : hasEnemy
                    ? enemy.name
                    : `Casa ${position.x + 1}, ${position.y + 1}`
              }
              className={`${reachable ? "is-reachable" : ""} ${hasPlayer ? "has-player" : ""} ${hasEnemy ? "has-enemy" : ""}`}
              disabled={!reachable}
              key={`${position.x}-${position.y}`}
              onClick={() => onMove(position)}
              type="button"
            >
              {hasPlayer ? (
                <span title={player.name}>{player.name.slice(0, 2).toUpperCase()}</span>
              ) : null}
              {hasEnemy ? (
                <span title={enemy.name}>{enemy.name.slice(0, 2).toUpperCase()}</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function createBattle(
  character: ArenaCharacter,
  rules: CombatRules,
  mode: ArenaMode,
  monsterIndex: number,
  opponent?: ArenaCharacter,
) {
  const attributes = { ...character.attributes };
  const equipmentModifiers = sumItemEffectModifiers(character.equipmentEffects);
  for (const [attribute, value] of Object.entries(equipmentModifiers)) {
    attributes[attribute as keyof CombatAttributes] += value ?? 0;
  }
  const player = applyBattleStartItemEffects(
    createCombatant({
      ...character,
      attributes,
      rules,
      itemEffects: character.equipmentEffects,
    }),
    character.equipmentEffects,
  );
  const trainingAttributes: CombatAttributes = {
    FOR: Math.max(35, Math.round(character.attributes.FOR * 0.55)),
    DEF: Math.max(25, Math.round(character.attributes.DEF * 0.65)),
    RES: Math.max(25, Math.round(character.attributes.RES * 0.65)),
    INI: Math.max(20, character.attributes.INI - 10),
    INT: 20,
    ARC: 0,
  };
  const monster = mode === "pve" ? arenaMonsters[monsterIndex % arenaMonsters.length] : null;
  const enemyAttributes = opponent
    ? { ...opponent.attributes }
    : monster
      ? buildAdaptiveMonsterAttributes(character.attributes, monster.weights)
      : trainingAttributes;
  if (opponent) {
    const opponentModifiers = sumItemEffectModifiers(opponent.equipmentEffects);
    for (const [attribute, value] of Object.entries(opponentModifiers)) {
      enemyAttributes[attribute as keyof CombatAttributes] += value ?? 0;
    }
  }
  const enemyBase = createCombatant({
    id: opponent?.id ?? monster?.key ?? "training",
    name: opponent?.name ?? monster?.name ?? "Boneco Rúnico",
    attributes: enemyAttributes,
    baseHp:
      opponent?.baseHp ??
      (monster ? character.baseHp : Math.max(450, Math.round(player.maxHp * 0.7))),
    baseMana: opponent?.baseMana ?? (monster ? character.baseMana : 0),
    classResource: opponent?.classResource,
    raceResource: opponent?.raceResource,
    usesMana: opponent?.usesMana,
    itemEffects: opponent?.equipmentEffects ?? [],
    rules,
  });
  const enemy = opponent
    ? applyBattleStartItemEffects(enemyBase, opponent.equipmentEffects)
    : enemyBase;
  return {
    player,
    enemy,
    title: opponent ? "Duelo entre aventureiros" : (monster?.title ?? "Autômato de treino"),
    sigil: opponent ? "対" : (monster?.sigil ?? "鬼"),
  };
}
