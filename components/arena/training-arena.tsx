"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { claimArenaVictoryAction } from "@/app/arena/actions";
import {
  calculateDamage,
  createCombatant,
  defaultCombatRules,
  getEffectiveAttributes,
  guardCombatant,
  resolveBasicAttack,
  tickCooldowns,
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
import { buildTurnOrder, isSilenced, isTurnBlocked } from "@/lib/game/turn-engine";
import { resolveJrpgAreaSkill, resolveJrpgSkill } from "@/lib/game/jrpg-skill";

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
  const [reward, setReward] = useState<{ xp: number; wg: number } | null>(null);
  const [rewardError, setRewardError] = useState("");
  const [claiming, startClaim] = useTransition();
  const activeId = turnOrder[turnIndex] ?? player.id;
  const playerTurn = activeId === player.id;
  const finished = player.hp <= 0 || enemy.hp <= 0;
  const rankReward = arenaRewards[character.adventureRank as keyof typeof arenaRewards] ?? arenaRewards.E;

  function finishAction(
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
    setMessage(`${text}${periodic.messages.length ? ` ${periodic.messages.join(" ")}` : ""}`);

    const nextIndex = turnIndex + 1;
    if (nextIndex >= turnOrder.length) {
      setRound((value) => value + 1);
      setTurnOrder(orderFor(finalPlayer, finalEnemy));
      setTurnIndex(0);
    } else {
      setTurnIndex(nextIndex);
    }
  }

  function applyPlayerResult(result: {
    actor: CombatantState;
    target: CombatantState;
    event: { kind: string; message: string };
  }) {
    if (result.event.kind === "error") return setMessage(result.event.message);
    if (result.target.hp <= 0) {
      setPlayer(result.actor);
      setEnemy(result.target);
      setMessage(`${result.event.message} Vitória!`);
      return;
    }
    finishAction(player.id, result.actor, result.target, result.event.message);
  }

  function useSkill(kind: "class" | "race", key: string) {
    if (!playerTurn || finished) return;
    if (isSilenced(player)) {
      setMessage(`${player.name} está silenciado e não pode usar habilidades.`);
      return;
    }
    const list = kind === "class" ? character.skills : character.raceAbilities;
    const skill = list.find((entry) => entry.key === key);
    if (!skill) return;
    const result =
      skill.area > 0
        ? (() => {
            const area = resolveJrpgAreaSkill(player, [enemy], skill, rules);
            return { actor: area.actor, target: area.targets[0], event: area.events[0] };
          })()
        : resolveJrpgSkill(player, enemy, skill, rules);
    applyPlayerResult(result);
  }

  function useItem(id: string) {
    if (!playerTurn || finished) return;
    const item = character.items.find((entry) => entry.id === id);
    if (!item) return;
    const healed = Math.min(
      Math.max(25, Math.round(player.maxHp * 0.25)),
      player.maxHp - player.hp,
    );
    finishAction(
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
    const timer = window.setTimeout(() => {
      finishAction(
        active.id,
        player,
        enemy,
        `${active.name} está incapacitado e perdeu o turno.`,
      );
    }, 350);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, finished]);

  useEffect(() => {
    if (finished || playerTurn || isTurnBlocked(enemy)) return;
    const timer = window.setTimeout(() => {
      let actingEnemy = enemy;
      let result;
      if (
        mode === "pve" &&
        actingEnemy.hp < actingEnemy.maxHp * 0.3 &&
        (actingEnemy.cooldowns["defesa-total"] ?? 0) === 0
      ) {
        actingEnemy = guardCombatant(actingEnemy);
        result = {
          actor: actingEnemy,
          target: player,
          event: { kind: "utility", message: `${actingEnemy.name} assumiu Defesa Total.` },
        };
      } else {
        result = resolveBasicAttack(actingEnemy, player, rules);
      }
      if (result.target.hp <= 0) {
        setEnemy(result.actor);
        setPlayer(result.target);
        setMessage(`${result.event.message} Você foi derrotado.`);
        return;
      }
      finishAction(enemy.id, result.target, result.actor, result.event.message);
    }, 450);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, finished, playerTurn]);

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
          <h1>{character.name} contra {initial.enemyName}</h1>
          <p>Uma ação por turno. INI define a ordem e é recalculada a cada nova rodada.</p>
        </div>
        {mode === "training" && options.length > 1 ? (
          <select value={character.id} onChange={(event) => onChange(event.target.value)}>
            {options.map((entry) => (
              <option key={entry.id} value={entry.id}>{entry.name}</option>
            ))}
          </select>
        ) : null}
        <strong className="arena-turn-counter"><small>Rodada</small>{String(round).padStart(2, "0")}</strong>
      </header>

      <div className="jrpg-turn-order">
        {turnOrder.map((id, index) => (
          <span className={activeId === id ? "is-active" : ""} key={id}>
            {index + 1}. {id === player.id ? player.name : enemy.name}
          </span>
        ))}
      </div>

      <div className="pvp-fighters jrpg-stage">
        <CombatantCard
          fighter={player}
          name={character.name}
          subtitle={`${character.raceName} · ${character.className}`}
          imageUrl={character.imageUrl}
          active={playerTurn && !finished}
        />
        <span className="pvp-versus">VS<small>turnos</small></span>
        <CombatantCard
          fighter={enemy}
          name={enemy.name}
          subtitle={mode === "training" ? "Boneco de Treino" : "Criatura hostil"}
          imageUrl={initial.enemyImage}
          active={!playerTurn && !finished}
        />
      </div>

      <p className="arena-message" role="status"><span>Combate</span>{message}</p>

      {!finished ? (
        <section className="arena-command-panel jrpg-command-panel">
          <header>
            <div><span className="eyebrow">Comandos</span><h2>{playerTurn ? "Escolha uma ação" : `Turno de ${enemy.name}`}</h2></div>
            <small>Cada comando encerra o turno.</small>
          </header>
          {panel === "root" ? (
            <div className="pvp-actions-grid jrpg-actions">
              <Command disabled={!playerTurn || isTurnBlocked(player)} name="Atacar" detail="Ataque básico" onClick={() => applyPlayerResult(resolveBasicAttack(player, enemy, rules))} />
              <Command disabled={!playerTurn || isTurnBlocked(player) || character.skills.length === 0} name="Habilidades" detail={`${character.skills.length} de classe`} onClick={() => setPanel("class")} />
              <Command disabled={!playerTurn || isTurnBlocked(player) || character.raceAbilities.length === 0} name="Raça" detail={`${character.raceAbilities.length} racial(is)`} onClick={() => setPanel("race")} />
              <Command disabled={!playerTurn || isTurnBlocked(player) || character.items.length === 0} name="Item" detail={`${character.items.length} disponível(is)`} onClick={() => setPanel("item")} />
              <Command disabled={!playerTurn || isTurnBlocked(player) || (player.cooldowns["defesa-total"] ?? 0) > 0} name="Defender" detail="Bloqueia o próximo dano" onClick={() => finishAction(player.id, guardCombatant(player), enemy, `${player.name} assumiu Defesa Total.`)} />
              <Command disabled={!playerTurn || isTurnBlocked(player)} name="Aguardar" detail="Passa o turno" onClick={() => finishAction(player.id, player, enemy, `${player.name} aguardou.`)} />
            </div>
          ) : (
            <div className="jrpg-submenu">
              <button className="button button--ghost" type="button" onClick={() => setPanel("root")}>← Voltar</button>
              {panel === "class" ? character.skills.map((skill) => <SkillCommand key={skill.key} fighter={player} skill={skill} onClick={() => useSkill("class", skill.key)} />) : null}
              {panel === "race" ? character.raceAbilities.map((skill) => <SkillCommand key={skill.key} fighter={player} skill={skill} onClick={() => useSkill("race", skill.key)} />) : null}
              {panel === "item" ? character.items.map((item) => <Command key={item.id} disabled={!playerTurn} name={item.name} detail={item.description || "Usar item"} onClick={() => useItem(item.id)} />) : null}
            </div>
          )}
        </section>
      ) : (
        <section className="arena-result">
          <span>{enemy.hp <= 0 ? "VITÓRIA" : "DERROTA"}</span>
          <h2>{enemy.hp <= 0 ? `${enemy.name} foi derrotado.` : `${character.name} caiu em combate.`}</h2>
          {mode === "pve" && enemy.hp <= 0 ? (
            <>
              <p>Recompensa prevista: +{rankReward.xp.toLocaleString("pt-BR")} XP · +{rankReward.wg.toLocaleString("pt-BR")} WG</p>
              {!reward ? (
                <button className="button button--primary" disabled={claiming} onClick={claimReward} type="button">
                  {claiming ? "Registrando…" : "Receber recompensa"}
                </button>
              ) : (
                <strong>+{reward.xp.toLocaleString("pt-BR")} XP · +{reward.wg.toLocaleString("pt-BR")} WG recebidos</strong>
              )}
              {rewardError ? <p className="arena-result__error">{rewardError}</p> : null}
            </>
          ) : null}
          <button className="button button--ghost" onClick={onReset} type="button">Lutar novamente</button>
        </section>
      )}
    </section>
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
  const player = applyBattleStartItemEffects(
    createCombatant({ ...character, attributes, rules, itemEffects: character.equipmentEffects }),
    character.equipmentEffects,
  );

  if (opponent) {
    const enemyAttributes = { ...opponent.attributes };
    for (const [key, value] of Object.entries(sumItemEffectModifiers(opponent.equipmentEffects)))
      enemyAttributes[key as keyof typeof enemyAttributes] += value ?? 0;
    const enemy = applyBattleStartItemEffects(
      createCombatant({ ...opponent, attributes: enemyAttributes, rules, itemEffects: opponent.equipmentEffects }),
      opponent.equipmentEffects,
    );
    return { player, enemy, enemyName: opponent.name, enemyImage: opponent.imageUrl, message: "O duelo começou." };
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
      enemyImage: "",
      message: "Treino iniciado. Teste sua rotação sem recompensas.",
    };
  }

  const monster = arenaMonsters[Math.abs(monsterIndex) % arenaMonsters.length];
  const monsterAttributes = buildAdaptiveMonsterAttributes(character.attributes, monster.weights);
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

function CombatantCard({ fighter, name, subtitle, imageUrl, active }: {
  fighter: CombatantState;
  name: string;
  subtitle: string;
  imageUrl: string;
  active: boolean;
}) {
  const resource = fighter.maxClassResource > 0
    ? `${fighter.classResourceName}: ${fighter.classResource}/${fighter.maxClassResource}`
    : fighter.maxMana > 0
      ? `Mana: ${fighter.mana}/${fighter.maxMana}`
      : null;
  return (
    <article className={`pvp-fighter jrpg-fighter ${active ? "is-active" : ""}`}>
      <div className="jrpg-fighter__portrait" style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}>
        {!imageUrl ? name.slice(0, 2).toUpperCase() : null}
      </div>
      <h3>{name}</h3><p>{subtitle}</p>
      <progress max={fighter.maxHp} value={fighter.hp} />
      <strong>{fighter.hp.toLocaleString("pt-BR")} / {fighter.maxHp.toLocaleString("pt-BR")} HP</strong>
      {resource ? <em>{resource}</em> : null}
      {Object.values(fighter.statuses).length ? (
        <small>{Object.values(fighter.statuses).map((status) => `${status.name} (${status.duration})`).join(" · ")}</small>
      ) : null}
    </article>
  );
}

function SkillCommand({ fighter, skill, onClick }: {
  fighter: CombatantState;
  skill: ArenaCharacter["skills"][number];
  onClick(): void;
}) {
  const cooldown = fighter.cooldowns[skill.key] ?? 0;
  const available = skill.resource === "mana"
    ? fighter.mana
    : skill.resource === "life"
      ? fighter.hp
      : skill.resource === "special"
        ? skill.resourceKey === "race" ? fighter.raceResource : fighter.classResource
        : Number.POSITIVE_INFINITY;
  const label = skill.resource === "none"
    ? "Sem custo"
    : `${skill.cost} ${skill.resource === "mana" ? "Mana" : skill.resource === "life" ? "HP" : skill.resourceKey === "race" ? fighter.raceResourceName : fighter.classResourceName}`;
  return (
    <Command
      disabled={cooldown > 0 || available < skill.cost || isSilenced(fighter)}
      name={skill.name}
      detail={`${label}${cooldown ? ` · recarga ${cooldown}` : ""}`}
      onClick={onClick}
    />
  );
}

function Command({ name, detail, disabled, onClick }: {
  name: string;
  detail: string;
  disabled: boolean;
  onClick(): void;
}) {
  return (
    <button className="arena-action-card jrpg-action" disabled={disabled} onClick={onClick} type="button">
      <strong>{name}</strong><small>{detail}</small>
    </button>
  );
}
