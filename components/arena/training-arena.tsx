"use client";
/* eslint-disable react-hooks/purity, react-hooks/rules-of-hooks -- useSkill/useItem are combat commands, not React hooks. */

import { useEffect, useMemo, useState, useTransition } from "react";
import { claimArenaVictoryAction } from "@/app/arena/actions";
import { CharacterPortraitCard } from "@/components/characters/character-portrait-card";
import { CombatSkillCard } from "@/components/arena/combat-skill-card";
import { CombatStatusDock } from "@/components/arena/combat-status-dock";
import {
  calculateDamage,
  createCombatant,
  defaultCombatRules,
  getEffectiveAttributes,
  guardCombatant,
  applyDamage,
  resolveBasicAttack,
  tickCooldowns,
  type CombatEvent,
  type CombatRules,
  type CombatantState,
} from "@/lib/game/combat";
import {
  arenaMonsters,
  arenaRewards,
  buildAdaptiveMonsterAttributes,
  type ArenaMode,
} from "@/lib/game/arena";
import {
  applyBattleStartItemEffects,
  resolvePeriodicItemDamage,
  sumItemEffectModifiers,
} from "@/lib/game/item-effects";
import type { ArenaCharacter } from "@/lib/game/arena-types";
import {
  buildTurnOrder,
  createTurnActionUsage,
  hasUsedAllCoreActions,
  isSilenced,
  isTurnBlocked,
  type TurnActionUsage,
} from "@/lib/game/turn-engine";
import { resolveJrpgAreaSkill, resolveJrpgSkill } from "@/lib/game/jrpg-skill";
import { applyEventResourceGeneration, applyResourceTrigger } from "@/lib/game/combat-resources";
import { applyCombatLorePassives } from "@/lib/game/combat-passives";

type BattleFxKind = "damage" | "heal" | "shield" | "magic";
type BattleFx = { target: "player" | "enemy"; kind: BattleFxKind; token: number } | null;

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
    <JrpgBattle
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

function JrpgBattle({
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
  const [round, setRound] = useState(1);
  const [turnOrder, setTurnOrder] = useState(() => orderFor(initial.player, initial.enemy));
  const [turnIndex, setTurnIndex] = useState(0);
  const [message, setMessage] = useState(initial.message);
  const [panel, setPanel] = useState<"root" | "class" | "race" | "item">("root");
  const [usedActions, setUsedActions] = useState<TurnActionUsage>(() => createTurnActionUsage());
  const [battleFx, setBattleFx] = useState<BattleFx>(null);
  const [reward, setReward] = useState<{ xp: number; wg: number } | null>(null);
  const [rewardError, setRewardError] = useState("");
  const [claiming, startClaim] = useTransition();
  const activeId = turnOrder[turnIndex] ?? player.id;
  const playerTurn = activeId === player.id;
  const finished = player.hp <= 0 || enemy.hp <= 0;
  const rankReward =
    arenaRewards[character.adventureRank as keyof typeof arenaRewards] ?? arenaRewards.E;

  function playFx(target: "player" | "enemy", event: CombatEvent) {
    const kind: BattleFxKind =
      event.kind === "heal"
        ? "heal"
        : event.kind === "shield"
          ? "shield"
          : event.kind === "damage" && event.damageType === "magic"
            ? "magic"
            : "damage";
    setBattleFx({ target, kind, token: Date.now() });
  }

  function advanceTurn(
    actingId: string,
    nextPlayer: CombatantState,
    nextEnemy: CombatantState,
    text: string,
  ) {
    let finalPlayer = nextPlayer;
    let finalEnemy = nextEnemy;
    const acting = actingId === nextPlayer.id ? nextPlayer : nextEnemy;
    const periodic = resolvePeriodicItemDamage(acting, (amount, type) =>
      calculateDamage(amount, type, getEffectiveAttributes(acting), rules),
    );
    const cooled = tickCooldowns(periodic.combatant);
    if (actingId === nextPlayer.id) finalPlayer = cooled;
    else finalEnemy = cooled;
    setPlayer(finalPlayer);
    setEnemy(finalEnemy);
    setPanel("root");
    setUsedActions(createTurnActionUsage());
    setMessage(`${text}${periodic.messages.length ? ` ${periodic.messages.join(" ")}` : ""}`);
    const nextIndex = turnIndex + 1;
    if (nextIndex >= turnOrder.length) {
      setRound((value) => value + 1);
      setTurnOrder(orderFor(finalPlayer, finalEnemy));
      setTurnIndex(0);
    } else setTurnIndex(nextIndex);
  }

  function keepPlayerTurn(
    nextPlayer: CombatantState,
    nextEnemy: CombatantState,
    text: string,
    usage: TurnActionUsage,
  ) {
    setPlayer(nextPlayer);
    setEnemy(nextEnemy);
    setUsedActions(usage);
    setPanel("root");
    const remaining = [
      !usage.basic ? "Ataque Básico" : null,
      !usage.class ? "Classe" : null,
      !usage.race ? "Raça" : null,
    ].filter(Boolean);
    setMessage(`${text}${remaining.length ? ` Ações restantes: ${remaining.join(" + ")}.` : ""}`);
  }

  function applyPlayerResult(
    result: { actor: CombatantState; target: CombatantState; event: CombatEvent },
    slot: keyof TurnActionUsage,
    targetIsPlayer = false,
    areaAction = false,
  ) {
    if (result.event.kind === "error") return setMessage(result.event.message);
    const targetCharacter = targetIsPlayer ? character : opponent;
    const generated = applyEventResourceGeneration({
      actor: result.actor,
      target: result.target,
      actorCharacter: character,
      targetCharacter,
      event: result.event,
      area: areaAction,
    });
    let nextPlayer = targetIsPlayer ? generated.target : generated.actor;
    const nextEnemy = targetIsPlayer ? enemy : generated.target;
    if (targetIsPlayer && generated.actor.id === player.id)
      nextPlayer = generated.actor.id === generated.target.id ? generated.target : generated.actor;
    playFx(targetIsPlayer ? "player" : "enemy", result.event);
    const nextUsage = { ...usedActions, [slot]: true };
    if (nextEnemy.hp <= 0) {
      setPlayer(nextPlayer);
      setEnemy(nextEnemy);
      setUsedActions(nextUsage);
      setMessage(`${result.event.message} Vitória!`);
      return;
    }
    if (hasUsedAllCoreActions(nextUsage))
      advanceTurn(
        player.id,
        nextPlayer,
        nextEnemy,
        `${result.event.message} Sequência do turno concluída.`,
      );
    else keepPlayerTurn(nextPlayer, nextEnemy, result.event.message, nextUsage);
  }

  function useSkill(kind: "class" | "race", key: string) {
    if (!playerTurn || finished || usedActions[kind]) return;
    if (isSilenced(player))
      return setMessage(`${player.name} está silenciado e não pode usar habilidades.`);
    const list = kind === "class" ? character.skills : character.raceAbilities;
    const skill = list.find((entry) => entry.key === key);
    if (!skill) return;
    const targetIsPlayer = skill.target === "self" || skill.target === "ally";
    const selectedTarget = targetIsPlayer ? player : enemy;
    const areaAction = skill.area > 0;
    const result = areaAction
      ? (() => {
          const area = resolveJrpgAreaSkill(player, [selectedTarget], skill, rules);
          return { actor: area.actor, target: area.targets[0], event: area.events[0] };
        })()
      : resolveJrpgSkill(player, selectedTarget, skill, rules);
    if (!result.target || !result.event) return;
    applyPlayerResult(result, kind, targetIsPlayer, areaAction);
  }

  function useItem(id: string) {
    if (!playerTurn || finished) return;
    const item = character.items.find((entry) => entry.id === id);
    if (!item) return;
    const healed = Math.min(
      Math.max(25, Math.round(player.maxHp * 0.25)),
      player.maxHp - player.hp,
    );
    const event: CombatEvent = { kind: "heal", amount: healed, message: "" };
    playFx("player", event);
    advanceTurn(
      player.id,
      { ...player, hp: player.hp + healed },
      enemy,
      `${character.name} usou ${item.name} e recuperou ${healed} de HP.`,
    );
  }

  useEffect(() => {
    if (finished) return;
    const active = activeId === player.id ? player : enemy;
    if (!isTurnBlocked(active)) return;
    const timer = window.setTimeout(
      () =>
        advanceTurn(active.id, player, enemy, `${active.name} está incapacitado e perdeu o turno.`),
      350,
    );
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, finished]);

  useEffect(() => {
    if (finished || playerTurn || isTurnBlocked(enemy)) return;
    const timer = window.setTimeout(() => {
      const result = mode === "pve"
        ? resolveSmartPveTurn(enemy, player, rules, round)
        : resolveBasicAttack(enemy, player, rules);
      playFx("player", result.event);
      const targetPlayer =
        result.event.kind === "damage" && result.event.amount > 0
          ? applyResourceTrigger(result.target, character, "DAMAGE_TAKEN")
          : result.target;
      if (targetPlayer.hp <= 0) {
        setEnemy(result.actor);
        setPlayer(targetPlayer);
        setMessage(`${result.event.message} Você foi derrotado.`);
        return;
      }
      advanceTurn(enemy.id, targetPlayer, result.actor, result.event.message);
    }, 520);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, finished, playerTurn, mode, round, rules, enemy, player]);

  function claimReward() {
    if (!sessionId || reward || claiming || enemy.hp > 0 || mode !== "pve") return;
    startClaim(async () => {
      const result = await claimArenaVictoryAction(sessionId);
      if (result.ok) setReward({ xp: result.xp, wg: result.wg });
      else setRewardError(result.message);
    });
  }

  return (
    <section className="arena-console jrpg-battle">
      <header className="arena-toolbar arena-game-header">
        <div>
          <span className="eyebrow">
            {mode === "training" ? "Treino" : "PvE"} · combate por turnos
          </span>
          <h1>
            {character.name} contra {initial.enemyName}
          </h1>
          <p>
            Em seu turno: 1 Ataque Básico + 1 habilidade de Classe + 1 habilidade Racial. INI define
            a ordem.
          </p>
        </div>
        {mode === "training" && options.length > 1 ? (
          <select value={character.id} onChange={(event) => onChange(event.target.value)}>
            {options.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
          </select>
        ) : null}
        <strong className="arena-turn-counter">
          <small>Rodada</small>
          {String(round).padStart(2, "0")}
        </strong>
      </header>

      <div className="jrpg-turn-order">
        {turnOrder.map((id, index) => (
          <span className={activeId === id ? "is-active" : ""} key={id}>
            {index + 1}. {id === player.id ? player.name : enemy.name}
          </span>
        ))}
      </div>
      <div className="turn-action-economy">
        <ActionSlot label="Ataque" used={usedActions.basic} />
        <ActionSlot label="Classe" used={usedActions.class} />
        <ActionSlot label="Raça" used={usedActions.race} />
      </div>

      <div className="pvp-fighters jrpg-stage">
        <CombatantCard
          fighter={player}
          name={character.name}
          subtitle={`${character.raceName} · ${character.className}`}
          imageUrl={character.imageUrl}
          active={playerTurn && !finished}
          character={character}
          fx={battleFx?.target === "player" ? battleFx : null}
        />
        <span className="pvp-versus">
          VS<small>turnos</small>
        </span>
        <CombatantCard
          fighter={enemy}
          name={enemy.name}
          subtitle={mode === "training" ? "Construto de Treino" : "Criatura hostil"}
          imageUrl={initial.enemyImage}
          active={!playerTurn && !finished}
          character={opponent}
          fx={battleFx?.target === "enemy" ? battleFx : null}
        />
      </div>

      <p className="arena-message" role="status">
        <span>Combate</span>
        {message}
      </p>

      {!finished ? (
        <section className="arena-command-panel jrpg-command-panel">
          <header>
            <div>
              <span className="eyebrow">Comandos</span>
              <h2>{playerTurn ? "Monte sua sequência" : `Turno de ${enemy.name}`}</h2>
            </div>
            <small>
              {isSilenced(player)
                ? "Silenciado: habilidades bloqueadas."
                : "Curas e buffs usam seu personagem; ataques e debuffs usam o inimigo."}
            </small>
          </header>
          {panel === "root" ? (
            <div className="pvp-actions-grid jrpg-actions">
              <Command
                disabled={!playerTurn || isTurnBlocked(player) || usedActions.basic}
                used={usedActions.basic}
                name="Atacar"
                detail={usedActions.basic ? "Já usado neste turno" : "Ataque básico"}
                onClick={() => applyPlayerResult(resolveBasicAttack(player, enemy, rules), "basic")}
              />
              <Command
                disabled={
                  !playerTurn ||
                  isTurnBlocked(player) ||
                  isSilenced(player) ||
                  character.skills.length === 0 ||
                  usedActions.class
                }
                used={usedActions.class}
                name="Habilidades"
                detail={
                  usedActions.class ? "Classe já usada" : `${character.skills.length} de classe`
                }
                onClick={() => setPanel("class")}
              />
              <Command
                disabled={
                  !playerTurn ||
                  isTurnBlocked(player) ||
                  isSilenced(player) ||
                  character.raceAbilities.length === 0 ||
                  usedActions.race
                }
                used={usedActions.race}
                name="Raça"
                detail={
                  usedActions.race
                    ? "Racial já usada"
                    : `${character.raceAbilities.length} racial(is)`
                }
                onClick={() => setPanel("race")}
              />
              <Command
                disabled={!playerTurn || isTurnBlocked(player) || character.items.length === 0}
                name="Item"
                detail={`${character.items.length} disponível(is) · encerra turno`}
                onClick={() => setPanel("item")}
              />
              <Command
                disabled={!playerTurn || isTurnBlocked(player)}
                name="Encerrar turno"
                detail="Finaliza sua sequência agora"
                onClick={() =>
                  advanceTurn(player.id, player, enemy, `${player.name} encerrou o turno.`)
                }
              />
            </div>
          ) : (
            <div className="jrpg-submenu combat-skill-list">
              <button
                className="button button--ghost"
                type="button"
                onClick={() => setPanel("root")}
              >
                ← Voltar
              </button>
              {panel === "class"
                ? character.skills.map((skill) => (
                    <CombatSkillCard
                      key={skill.key}
                      fighter={player}
                      target={skill.target === "self" || skill.target === "ally" ? player : enemy}
                      rules={rules}
                      skill={skill}
                      disabled={!playerTurn || isSilenced(player)}
                      used={usedActions.class}
                      onClick={() => useSkill("class", skill.key)}
                    />
                  ))
                : null}
              {panel === "race"
                ? character.raceAbilities.map((skill) => (
                    <CombatSkillCard
                      key={skill.key}
                      fighter={player}
                      target={skill.target === "self" || skill.target === "ally" ? player : enemy}
                      rules={rules}
                      skill={skill}
                      disabled={!playerTurn || isSilenced(player)}
                      used={usedActions.race}
                      onClick={() => useSkill("race", skill.key)}
                    />
                  ))
                : null}
              {panel === "item"
                ? character.items.map((item) => (
                    <Command
                      key={item.id}
                      disabled={!playerTurn}
                      name={item.name}
                      detail={`${item.description || "Usar item"} · encerra turno`}
                      onClick={() => useItem(item.id)}
                    />
                  ))
                : null}
            </div>
          )}
        </section>
      ) : (
        <section className="arena-result">
          <span>{enemy.hp <= 0 ? "VITÓRIA" : "DERROTA"}</span>
          <h2>
            {enemy.hp <= 0 ? `${enemy.name} foi derrotado.` : `${character.name} caiu em combate.`}
          </h2>
          {mode === "pve" && enemy.hp <= 0 ? (
            <>
              <p>
                Recompensa prevista: +{rankReward.xp.toLocaleString("pt-BR")} XP · +
                {rankReward.wg.toLocaleString("pt-BR")} WG
              </p>
              {!reward ? (
                <button
                  className="button button--primary"
                  disabled={claiming}
                  onClick={claimReward}
                  type="button"
                >
                  {claiming ? "Registrando…" : "Receber recompensa"}
                </button>
              ) : (
                <strong>
                  +{reward.xp.toLocaleString("pt-BR")} XP · +{reward.wg.toLocaleString("pt-BR")} WG
                  recebidos
                </strong>
              )}
              {rewardError ? <p className="arena-result__error">{rewardError}</p> : null}
            </>
          ) : null}
          <button className="button button--ghost" onClick={onReset} type="button">
            Lutar novamente
          </button>
        </section>
      )}
    </section>
  );
}

function ActionSlot({ label, used }: { label: string; used: boolean }) {
  return (
    <span className={used ? "is-used" : ""}>
      <i>{used ? "✓" : "•"}</i>
      {label}
      <small>{used ? "usado" : "disponível"}</small>
    </span>
  );
}
function orderFor(player: CombatantState, enemy: CombatantState) {
  return buildTurnOrder([
    { id: player.id, initiative: getEffectiveAttributes(player).INI },
    { id: enemy.id, initiative: getEffectiveAttributes(enemy).INI },
  ]);
}

function createBattle(
  character: ArenaCharacter,
  rules: CombatRules,
  mode: ArenaMode,
  monsterIndex: number,
  opponent?: ArenaCharacter,
) {
  const attributes = { ...character.attributes };
  for (const [key, value] of Object.entries(sumItemEffectModifiers(character.equipmentEffects)))
    attributes[key as keyof typeof attributes] += value ?? 0;
  const player = applyCombatLorePassives(applyBattleStartItemEffects(
    createCombatant({ ...character, attributes, rules, itemEffects: character.equipmentEffects }),
    character.equipmentEffects,
  ), character);
  if (opponent) {
    const enemyAttributes = { ...opponent.attributes };
    for (const [key, value] of Object.entries(sumItemEffectModifiers(opponent.equipmentEffects)))
      enemyAttributes[key as keyof typeof enemyAttributes] += value ?? 0;
    const enemy = applyCombatLorePassives(applyBattleStartItemEffects(
      createCombatant({
        ...opponent,
        attributes: enemyAttributes,
        rules,
        itemEffects: opponent.equipmentEffects,
      }),
      opponent.equipmentEffects,
    ), opponent);
    return {
      player,
      enemy,
      enemyName: opponent.name,
      enemyImage: opponent.imageUrl,
      message: "O duelo começou.",
    };
  }
  if (mode === "training") {
    const enemy = createCombatant({
      id: "boneco-runico",
      name: "Boneco Rúnico",
      attributes: {
        FOR: 8,
        DEF: Math.max(10, Math.round(character.attributes.FOR * 0.5)),
        RES: 20,
        INI: 1,
        INT: 1,
        ARC: 1,
      },
      baseHp: Math.max(1000, player.maxHp * 3),
      baseMana: 0,
      usesMana: false,
      rules,
    });
    return {
      player,
      enemy,
      enemyName: enemy.name,
      enemyImage: "/images/monsters/pve/golem-runa.webp",
      message: "Treino iniciado. Monte sua sequência de Ataque + Classe + Raça sem recompensas.",
    };
  }
  const monster = arenaMonsters[Math.abs(monsterIndex) % arenaMonsters.length];
  const adaptive = buildAdaptiveMonsterAttributes(character.attributes, monster.weights);
  const monsterAttributes = Object.fromEntries(
    Object.entries(adaptive).map(([key, value]) => [key, Math.round(value * 1.12)]),
  ) as typeof adaptive;
  const enemy = createCombatant({
    id: monster.key,
    name: monster.name,
    attributes: monsterAttributes,
    baseHp: character.baseHp,
    baseMana: Math.max(0, character.baseMana),
    usesMana: character.baseMana > 0,
    rules: rules ?? defaultCombatRules,
  });
  return {
    player,
    enemy,
    enemyName: monster.name,
    enemyImage: monster.imageUrl,
    message: `${monster.name} surgiu. A iniciativa decidirá o primeiro turno.`,
  };
}

export function resolveSmartPveTurn(
  monster: CombatantState,
  player: CombatantState,
  rules: CombatRules,
  round: number,
) {
  const hpRatio = monster.hp / Math.max(1, monster.maxHp);
  if (hpRatio < 0.45 && monster.shield < monster.maxHp * 0.08 && (monster.cooldowns["defesa-total"] ?? 0) === 0) {
    const guarded = guardCombatant(monster);
    const shield = Math.max(30, Math.round(monster.maxHp * 0.12));
    return {
      actor: { ...guarded, shield: guarded.shield + shield },
      target: player,
      event: { kind: "shield" as const, amount: shield, message: `${monster.name} leu o combate, assumiu postura defensiva e recebeu ${shield} de escudo.` },
    };
  }
  if (hpRatio < 0.6 && round % 3 === 0) {
    const stats = getEffectiveAttributes(monster);
    const raw = Math.max(stats.INT, stats.FOR) * 1.08;
    const amount = calculateDamage(raw, stats.INT >= stats.FOR ? "magic" : "physical", getEffectiveAttributes(player), rules);
    const target = applyDamage(player, amount);
    const dealt = player.hp + player.shield - target.hp - target.shield;
    const healing = Math.min(Math.round(dealt * 0.5), monster.maxHp - monster.hp);
    return {
      actor: { ...monster, hp: monster.hp + healing },
      target,
      event: { kind: "damage" as const, amount: dealt, damageType: stats.INT >= stats.FOR ? "magic" as const : "physical" as const, message: `${monster.name} explorou a abertura, causou ${dealt} de dano e recuperou ${healing} de HP.` },
    };
  }
  const result = resolveBasicAttack(monster, player, { ...rules, basicAttackMultiplier: rules.basicAttackMultiplier * (round >= 4 ? 1.22 : 1.12) });
  return { ...result, event: { ...result.event, message: `${result.event.message} O monstro escolheu o alvo após avaliar suas defesas.` } };
}

function CombatantCard({
  fighter,
  name,
  subtitle,
  imageUrl,
  active,
  character,
  fx,
}: {
  fighter: CombatantState;
  name: string;
  subtitle: string;
  imageUrl: string;
  active: boolean;
  character?: ArenaCharacter;
  fx: BattleFx;
}) {
  return (
    <article
      className={`pvp-fighter jrpg-fighter ${active ? "is-active" : ""} ${fx ? `fx-${fx.kind}` : ""}`}
    >
      <div className="combat-identity-frame">
        {character ? (
          <CharacterPortraitCard
            name={character.name}
            imageUrl={character.imageUrl || null}
            rank={character.adventureRank}
            level={character.level}
            title={character.equippedTitle}
            variant="compact"
            className="combat-official-character-card"
          />
        ) : (
          <div
            className="jrpg-fighter__portrait monster-art"
            style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}
          >
            {!imageUrl ? name.slice(0, 2).toUpperCase() : null}
          </div>
        )}
        {fx ? (
          <span key={fx.token} className={`combat-fx combat-fx--${fx.kind}`}>
            {fx.kind === "heal"
              ? "+"
              : fx.kind === "shield"
                ? "✦"
                : fx.kind === "magic"
                  ? "✧"
                  : "✹"}
          </span>
        ) : null}
      </div>
      <div className="combat-hud-panel">
        <h3>{name}</h3>
        <p>{subtitle}</p>
        <CombatStatusDock fighter={fighter} />
        <div className="combat-meter combat-meter--hp">
          <span>
            <b>HP</b>
            <strong>
              {fighter.hp.toLocaleString("pt-BR")} / {fighter.maxHp.toLocaleString("pt-BR")}
            </strong>
          </span>
          <progress max={fighter.maxHp} value={fighter.hp} />
        </div>
        <div className="combat-resource-stack">
          {fighter.maxMana > 0 ? (
            <ResourceMeter label="Mana" value={fighter.mana} max={fighter.maxMana} kind="mana" />
          ) : null}
          {fighter.maxClassResource > 0 ? (
            <ResourceMeter
              label={fighter.classResourceName}
              value={fighter.classResource}
              max={fighter.maxClassResource}
              kind="class"
            />
          ) : null}
          {fighter.maxRaceResource > 0 ? (
            <ResourceMeter
              label={fighter.raceResourceName}
              value={fighter.raceResource}
              max={fighter.maxRaceResource}
              kind="race"
            />
          ) : null}
          {fighter.shield > 0 ? (
            <ResourceMeter
              label="Escudo"
              value={fighter.shield}
              max={Math.max(fighter.shield, fighter.maxHp)}
              kind="shield"
            />
          ) : null}
        </div>
      </div>
    </article>
  );
}

function ResourceMeter({
  label,
  value,
  max,
  kind,
}: {
  label: string;
  value: number;
  max: number;
  kind: "mana" | "class" | "race" | "shield";
}) {
  return (
    <div className={`combat-meter combat-meter--${kind}`}>
      <span>
        <b>{label}</b>
        <strong>
          {value} / {max}
        </strong>
      </span>
      <progress max={Math.max(1, max)} value={Math.max(0, value)} />
    </div>
  );
}
function Command({
  name,
  detail,
  disabled,
  used = false,
  onClick,
}: {
  name: string;
  detail: string;
  disabled: boolean;
  used?: boolean;
  onClick(): void;
}) {
  return (
    <button
      className={`arena-action-card jrpg-action ${used ? "is-used" : ""}`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <strong>{name}</strong>
      <small>{detail}</small>
    </button>
  );
}
