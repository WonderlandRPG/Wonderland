"use client";

import { useMemo, useState } from "react";

import styles from "@/app/arena/mapa-tatico/tactical-lab.module.css";
import {
  createCombatant,
  resolveBasicAttack,
  tickCooldowns,
  type CombatAttributes,
  type CombatantState,
} from "@/lib/game/combat";
import type { ClassSkill } from "@/lib/game/classes";
import {
  chooseTacticalProfileDestination,
  type TacticalAiProfile,
} from "@/lib/game/tactical-ai-profiles";
import {
  getForcedMovementDestination,
  getReachableTacticalCells,
  getTacticalAreaCells,
  getTacticalDistance,
  hasTacticalLineOfSight,
  tacticalPositionKey,
  type TacticalPosition,
} from "@/lib/game/tactical-grid";
import { resolveTacticalSkill } from "@/lib/game/tactical-skill";

type SkillSource = "class" | "race";
type TacticalItem = { id: string; name: string; description: string };
type TacticalCharacter = {
  id: string;
  name: string;
  level: number;
  rank: string;
  raceName: string;
  className: string;
  baseHp: number;
  baseMana: number;
  attributes: CombatAttributes;
  classResource: { name: string; initial: number; maximum: number; generationEvents?: Array<{ trigger: string; amount: number }> };
  raceResource: { name: string; initial: number; maximum: number; generationEvents?: Array<{ trigger: string; amount: number }> } | null;
  usesMana: boolean;
  basicAttackRange: number;
  basicAttackDamageType: "physical" | "magic";
  skills: Array<{ source: SkillSource; skill: ClassSkill }>;
  items: TacticalItem[];
};

type PlayerAction =
  | { kind: "basic"; name: string; range: number; area: 0 }
  | { kind: "skill"; name: string; range: number; area: number; source: SkillSource; skill: ClassSkill };

const GRID = { width: 10, height: 8 } as const;
const PLAYER_MOVE = 4;
const ENEMY_MOVE = 3;
const ENEMY_BASIC_RANGE = 1;
const START_PLAYER: TacticalPosition = { x: 2, y: 5 };
const START_ENEMY: TacticalPosition = { x: 7, y: 2 };
const obstacles = new Set(["4,1", "4,2", "4,3", "5,3", "6,3", "2,2", "7,5", "7,6"]);

function enemySkill(profile: TacticalAiProfile): ClassSkill {
  const shared = {
    level: 1,
    category: "Ofensiva",
    type: "Ativa",
    resource: "none" as const,
    resourceKey: "class" as const,
    cost: 0,
    area: 0,
    conditions: [],
    chance: 100,
    maxStacks: 1,
  };

  if (profile === "aggressive") {
    return {
      ...shared,
      key: "impacto-runico-aggressive",
      name: "Impacto Rúnico",
      effect: "Golpe pesado que causa dano e empurra.",
      kind: "damage",
      damageType: "physical",
      target: "enemy",
      cooldown: 2,
      range: 1,
      duration: 0,
      scaling: [{ attribute: "FOR", multiplier: 0.9 }],
      reachText: "1 casa",
      systemRule: "Dano físico seguido de PUSH.",
      playerDescription: "Impacto Rúnico causa dano e empurra 1 casa.",
      operations: [
        { operation: "DAMAGE", target: "enemy", base: 45, scaling: [{ attribute: "FOR", multiplier: 0.9 }], damageType: "physical", status: "", duration: 0, chance: 100, stacks: 0, maxStacks: 0, distance: 0, modifiers: [] },
        { operation: "PUSH", target: "enemy", base: 0, scaling: [], damageType: "none", status: "", duration: 0, chance: 100, stacks: 0, maxStacks: 0, distance: 1, modifiers: [] },
      ],
    };
  }

  if (profile === "ranged") {
    return {
      ...shared,
      key: "flecha-runica-ranged",
      name: "Flecha Rúnica",
      effect: "Projétil mágico de longo alcance.",
      kind: "damage",
      damageType: "magic",
      target: "enemy",
      cooldown: 1,
      range: 4,
      duration: 0,
      scaling: [{ attribute: "INT", multiplier: 0.9 }],
      reachText: "4 casas",
      systemRule: "Ataque mágico de longo alcance.",
      playerDescription: "Flecha Rúnica causa dano mágico a distância.",
      operations: [
        { operation: "DAMAGE", target: "enemy", base: 35, scaling: [{ attribute: "INT", multiplier: 0.9 }], damageType: "magic", status: "", duration: 0, chance: 100, stacks: 0, maxStacks: 0, distance: 0, modifiers: [] },
      ],
    };
  }

  return {
    ...shared,
    key: "prisao-runica-controller",
    name: "Prisão Rúnica",
    effect: "Rajada de controle que causa dano e imobiliza.",
    kind: "damage",
    damageType: "magic",
    target: "enemy",
    cooldown: 2,
    range: 3,
    duration: 1,
    scaling: [{ attribute: "INT", multiplier: 0.75 }],
    reachText: "3 casas",
    systemRule: "Dano mágico seguido de ROOT.",
    playerDescription: "Prisão Rúnica causa dano mágico e Root por 1 turno.",
    operations: [
      { operation: "DAMAGE", target: "enemy", base: 30, scaling: [{ attribute: "INT", multiplier: 0.75 }], damageType: "magic", status: "", duration: 0, chance: 100, stacks: 0, maxStacks: 0, distance: 0, modifiers: [] },
      { operation: "ROOT", target: "enemy", base: 0, scaling: [], damageType: "none", status: "prisao-runica", duration: 1, chance: 100, stacks: 1, maxStacks: 1, distance: 0, modifiers: [] },
    ],
  };
}

function makePlayer(character: TacticalCharacter) {
  return createCombatant({
    id: character.id,
    name: character.name,
    attributes: character.attributes,
    baseHp: character.baseHp,
    baseMana: character.baseMana,
    classResource: character.classResource,
    raceResource: character.raceResource,
    usesMana: character.usesMana,
    basicAttackDamageType: character.basicAttackDamageType,
  });
}

function makeEnemy(character: TacticalCharacter) {
  return createCombatant({
    id: "tactical-sentinel-v4",
    name: "Sentinela Rúnica",
    attributes: {
      FOR: Math.max(70, Math.round(character.attributes.FOR * 0.72)),
      DEF: Math.max(70, Math.round(character.attributes.DEF * 0.8)),
      RES: Math.max(70, Math.round(character.attributes.RES * 0.8)),
      INI: Math.max(70, Math.round(character.attributes.INI * 0.8)),
      INT: Math.max(85, Math.round(character.attributes.INT * 0.85)),
      ARC: Math.max(50, Math.round(character.attributes.ARC * 0.6)),
    },
    baseHp: 650,
    baseMana: 0,
    usesMana: false,
  });
}

function rootTurns(combatant: CombatantState) {
  return Object.entries(combatant.statuses).reduce((max, [key, status]) => {
    const text = `${key} ${status.name}`.toLowerCase();
    return /root|enraiz|imobil|prisao/.test(text) ? Math.max(max, status.duration) : max;
  }, 0);
}

function percent(current: number, maximum: number) {
  return maximum <= 0 ? 0 : Math.max(0, Math.min(100, (current / maximum) * 100));
}

function affectsEnemy(skill: ClassSkill) {
  return skill.operations.some((operation) => operation.target === "enemy" || operation.target === "area");
}

export function TacticalLabV4({ characters }: { characters: TacticalCharacter[] }) {
  const first = characters[0];
  const [characterId, setCharacterId] = useState(first?.id ?? "");
  const selectedCharacter = characters.find((entry) => entry.id === characterId) ?? first;
  const [profile, setProfile] = useState<TacticalAiProfile>("controller");
  const [playerPosition, setPlayerPosition] = useState<TacticalPosition>(START_PLAYER);
  const [enemyPosition, setEnemyPosition] = useState<TacticalPosition>(START_ENEMY);
  const [playerState, setPlayerState] = useState<CombatantState | null>(() => first ? makePlayer(first) : null);
  const [enemyState, setEnemyState] = useState<CombatantState | null>(() => first ? makeEnemy(first) : null);
  const [movement, setMovement] = useState(PLAYER_MOVE);
  const [action, setAction] = useState<PlayerAction | null>(null);
  const [areaCenter, setAreaCenter] = useState<TacticalPosition | null>(null);
  const [usedBasic, setUsedBasic] = useState(false);
  const [usedClass, setUsedClass] = useState(false);
  const [usedRace, setUsedRace] = useState(false);
  const [usedItem, setUsedItem] = useState(false);
  const [round, setRound] = useState(1);
  const [message, setMessage] = useState("Motor V4 pronto para testes.");
  const [log, setLog] = useState<string[]>(["V4: perfis de IA + resolvedor determinístico."]);

  const reachable = useMemo(() => getReachableTacticalCells({
    start: playerPosition,
    blocked: new Set([...obstacles, tacticalPositionKey(enemyPosition)]),
    movement,
    grid: GRID,
  }), [playerPosition, enemyPosition, movement]);
  const areaCells = useMemo(() => action && areaCenter
    ? getTacticalAreaCells({ center: areaCenter, radius: action.area, grid: GRID })
    : new Set<string>(), [action, areaCenter]);
  const cells = useMemo(() => Array.from({ length: GRID.width * GRID.height }, (_, index) => ({
    x: index % GRID.width,
    y: Math.floor(index / GRID.width),
  })), []);

  if (!selectedCharacter || !playerState || !enemyState) {
    return <section className={styles.empty}>Nenhum personagem disponível para o laboratório.</section>;
  }

  const character: TacticalCharacter = selectedCharacter;
  const player: CombatantState = playerState;
  const enemy: CombatantState = enemyState;
  const enemyAbility = enemySkill(profile);
  const playerRoot = rootTurns(player);
  const enemyRoot = rootTurns(enemy);
  const finished = player.hp <= 0 || enemy.hp <= 0;

  function addLog(text: string) {
    setLog((current) => [text, ...current].slice(0, 14));
  }

  function isSourceUsed(source: SkillSource) {
    return source === "class" ? usedClass : usedRace;
  }

  function clearAction() {
    setAction(null);
    setAreaCenter(null);
  }

  function selectAction(next: PlayerAction) {
    if (finished) return setMessage("O combate terminou. Reinicie o mapa.");
    if (next.kind === "basic" && usedBasic) return setMessage("Ataque Básico já usado neste turno.");
    if (next.kind === "skill") {
      if (isSourceUsed(next.source)) return setMessage(`Habilidade de ${next.source === "class" ? "Classe" : "Raça"} já usada neste turno.`);
      const cooldown = player.cooldowns[next.skill.key] ?? 0;
      if (cooldown > 0) return setMessage(`${next.name} está em cooldown por ${cooldown} turno(s).`);
    }
    setAction(next);
    setAreaCenter(null);
    setMessage(`${next.name} selecionado.`);
  }

  function executePlayerSkill(selected: Extract<PlayerAction, { kind: "skill" }>, center: TacticalPosition) {
    if (selected.area > 0 && affectsEnemy(selected.skill)) {
      const affected = getTacticalAreaCells({ center, radius: selected.area, grid: GRID });
      if (!affected.has(tacticalPositionKey(enemyPosition))) return setMessage("A área escolhida não atingiu a Sentinela.");
    }

    const result = resolveTacticalSkill(player, enemy, selected.skill);
    if (result.event.kind === "error") return setMessage(result.event.message);

    let nextPlayerPosition = playerPosition;
    let nextEnemyPosition = enemyPosition;
    const spatial: string[] = [];

    for (const operation of selected.skill.operations) {
      const distance = Math.max(1, operation.distance || 1);
      if (operation.operation === "PUSH" && (operation.target === "enemy" || operation.target === "area")) {
        const forced = getForcedMovementDestination({
          source: nextPlayerPosition,
          target: nextEnemyPosition,
          distance,
          blocked: new Set([...obstacles, tacticalPositionKey(nextPlayerPosition)]),
          grid: GRID,
        });
        nextEnemyPosition = forced.position;
        spatial.push(forced.moved ? `Push: ${forced.moved} casa(s).` : "Push bloqueado.");
      }
      if ((operation.operation === "MOVE" || operation.operation === "TELEPORT") && (operation.target === "self" || operation.target === "source")) {
        const destinationKey = tacticalPositionKey(center);
        if (!obstacles.has(destinationKey) && destinationKey !== tacticalPositionKey(nextEnemyPosition) && getTacticalDistance(playerPosition, center) <= distance) {
          nextPlayerPosition = center;
          spatial.push(`${operation.operation}: casa ${center.x + 1},${center.y + 1}.`);
        }
      }
    }

    setPlayerState(result.actor);
    setEnemyState(result.target);
    setPlayerPosition(nextPlayerPosition);
    setEnemyPosition(nextEnemyPosition);
    if (selected.source === "class") setUsedClass(true); else setUsedRace(true);
    const text = `${result.event.message}${spatial.length ? ` ${spatial.join(" ")}` : ""}`;
    setMessage(text);
    addLog(text);
    clearAction();
  }

  function clickCell(position: TacticalPosition) {
    const key = tacticalPositionKey(position);

    if (!action) {
      if (playerRoot > 0) return setMessage(`Você está imobilizado por ${playerRoot} turno(s).`);
      if (!reachable.has(key)) return;
      const cost = reachable.get(key) ?? 0;
      setPlayerPosition(position);
      setMovement((current) => Math.max(0, current - cost));
      setMessage(`Movimento: ${cost} ponto(s) consumido(s).`);
      return;
    }

    if (obstacles.has(key)) return setMessage("Essa casa está bloqueada.");
    const distance = getTacticalDistance(playerPosition, position);
    if (distance > action.range) return setMessage(`${action.name}: fora do alcance (${distance}/${action.range}).`);

    if (action.kind === "basic") {
      if (key !== tacticalPositionKey(enemyPosition)) return setMessage("Selecione a Sentinela.");
      if (!hasTacticalLineOfSight({ from: playerPosition, to: enemyPosition, blocked: obstacles })) return setMessage("Linha de visão bloqueada.");
      const result = resolveBasicAttack(player, enemy);
      setPlayerState(result.actor);
      setEnemyState(result.target);
      setUsedBasic(true);
      setMessage(result.event.message);
      addLog(result.event.message);
      clearAction();
      return;
    }

    const enemyTarget = affectsEnemy(action.skill);
    if (enemyTarget && action.area <= 0 && key !== tacticalPositionKey(enemyPosition)) return setMessage("Selecione a Sentinela.");
    if (enemyTarget && !hasTacticalLineOfSight({ from: playerPosition, to: position, blocked: obstacles })) return setMessage(`${action.name}: linha de visão bloqueada.`);
    executePlayerSkill(action, position);
  }

  function useItem(item: TacticalItem) {
    if (usedItem || finished) return;
    const healed = Math.min(Math.max(25, Math.round(player.maxHp * 0.25)), player.maxHp - player.hp);
    setPlayerState({ ...player, hp: player.hp + healed });
    setUsedItem(true);
    const text = `${player.name} usou ${item.name} e recuperou ${healed} HP. O item real foi preservado.`;
    setMessage(text);
    addLog(text);
  }

  function executeEnemyTurn() {
    if (finished) return;

    let nextEnemy = enemy;
    let nextPlayer = player;
    let nextEnemyPosition = enemyPosition;
    let nextPlayerPosition = playerPosition;
    const notes = [`Rodada ${round}: Sentinela (${profile}).`];
    const skillAvailable = (nextEnemy.cooldowns[enemyAbility.key] ?? 0) <= 0;

    if (enemyRoot > 0) {
      notes.push(`Imobilizada por ${enemyRoot} turno(s).`);
    } else {
      const decision = chooseTacticalProfileDestination({
        profile,
        start: enemyPosition,
        target: playerPosition,
        movement: ENEMY_MOVE,
        grid: GRID,
        blocked: obstacles,
        sightBlocked: obstacles,
        basicRange: ENEMY_BASIC_RANGE,
        skillRange: enemyAbility.range,
        skillAvailable,
      });
      nextEnemyPosition = decision.position;
      notes.push(decision.movementCost > 0
        ? `Moveu ${decision.movementCost} casa(s): ${decision.reason}.`
        : `Manteve posição: ${decision.reason}.`);
    }

    const distance = getTacticalDistance(nextEnemyPosition, nextPlayerPosition);
    const sight = hasTacticalLineOfSight({ from: nextEnemyPosition, to: nextPlayerPosition, blocked: obstacles });

    if (skillAvailable && distance <= enemyAbility.range && sight) {
      const result = resolveTacticalSkill(nextEnemy, nextPlayer, enemyAbility);
      nextEnemy = result.actor;
      nextPlayer = result.target;
      notes.push(result.event.message);

      const push = enemyAbility.operations.find((operation) => operation.operation === "PUSH");
      if (push) {
        const forced = getForcedMovementDestination({
          source: nextEnemyPosition,
          target: nextPlayerPosition,
          distance: Math.max(1, push.distance || 1),
          blocked: new Set([...obstacles, tacticalPositionKey(nextEnemyPosition)]),
          grid: GRID,
        });
        nextPlayerPosition = forced.position;
        if (forced.moved) notes.push(`Jogador empurrado ${forced.moved} casa(s).`);
      }
    } else if (distance <= ENEMY_BASIC_RANGE && sight) {
      const result = resolveBasicAttack(nextEnemy, nextPlayer);
      nextEnemy = result.actor;
      nextPlayer = result.target;
      notes.push(result.event.message);
    } else {
      notes.push(`Sem ação ofensiva válida. Distância ${distance}.`);
    }

    nextPlayer = tickCooldowns(nextPlayer);
    nextEnemy = tickCooldowns(nextEnemy);
    setEnemyPosition(nextEnemyPosition);
    setPlayerPosition(nextPlayerPosition);
    setPlayerState(nextPlayer);
    setEnemyState(nextEnemy);
    setMovement(PLAYER_MOVE);
    setUsedBasic(false);
    setUsedClass(false);
    setUsedRace(false);
    setUsedItem(false);
    setRound((value) => value + 1);
    clearAction();
    notes.forEach(addLog);
    setMessage(nextPlayer.hp <= 0 ? `${nextPlayer.name} foi derrotado.` : `${notes.join(" ")} Seu turno.`);
  }

  function resetBoard(nextCharacter?: TacticalCharacter) {
    const chosen = nextCharacter ?? character;
    setPlayerPosition(START_PLAYER);
    setEnemyPosition(START_ENEMY);
    setPlayerState(makePlayer(chosen));
    setEnemyState(makeEnemy(chosen));
    setMovement(PLAYER_MOVE);
    setUsedBasic(false);
    setUsedClass(false);
    setUsedRace(false);
    setUsedItem(false);
    setRound(1);
    clearAction();
    setLog([`Mapa V4 reiniciado · perfil ${profile}.`]);
    setMessage("Mapa reiniciado.");
  }

  function changeCharacter(id: string) {
    const next = characters.find((entry) => entry.id === id);
    if (!next) return;
    setCharacterId(id);
    resetBoard(next);
  }

  function changeProfile(nextProfile: TacticalAiProfile) {
    setProfile(nextProfile);
    setEnemyState(makeEnemy(character));
    setEnemyPosition(START_ENEMY);
    setRound(1);
    clearAction();
    setLog([`Perfil da Sentinela alterado para ${nextProfile}.`]);
    setMessage(`IA alterada para ${nextProfile}.`);
  }

  return (
    <section className={styles.lab} aria-label="Laboratório do mapa tático V4">
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Somente ADM · motor tático V4</span>
          <h1>Laboratório do Mapa Tático</h1>
          <p>Habilidades determinísticas, economia 1+1+1+1 e perfis independentes de IA para criaturas.</p>
        </div>
        <div className={styles.status}><small>Protótipo</small><strong>V4 · Rodada {round}</strong></div>
      </header>

      <section className={styles.characterPanel} data-wl-surface="raised">
        <label><span>Personagem</span><select value={character.id} onChange={(event) => changeCharacter(event.target.value)}>{characters.map((entry) => <option key={entry.id} value={entry.id}>{entry.name} · Nv. {entry.level} · {entry.className}</option>)}</select></label>
        <label><span>Perfil da criatura</span><select value={profile} onChange={(event) => changeProfile(event.target.value as TacticalAiProfile)}><option value="aggressive">Agressiva</option><option value="ranged">Ranged</option><option value="controller">Controladora</option></select></label>
        <div className={styles.characterSummary}><strong>{character.name}</strong><span>{character.raceName} · {character.className} · Rank {character.rank}</span><span>HP {player.hp}/{player.maxHp} · Mana {player.mana}/{player.maxMana}</span></div>
      </section>

      <section className={styles.combatHud}>
        <article><small>AVENTUREIRO</small><strong>{player.name}</strong><div className={styles.bar}><i style={{ width: `${percent(player.hp, player.maxHp)}%` }} /></div><span>HP {player.hp}/{player.maxHp}</span>{player.maxMana > 0 ? <span>Mana {player.mana}/{player.maxMana}</span> : null}{playerRoot > 0 ? <span>ROOT: {playerRoot}</span> : null}</article>
        <article data-enemy="true"><small>IA · {profile.toUpperCase()}</small><strong>Sentinela Rúnica</strong><div className={styles.bar}><i style={{ width: `${percent(enemy.hp, enemy.maxHp)}%` }} /></div><span>HP {enemy.hp}/{enemy.maxHp}</span><span>{enemyAbility.name} · CD {enemy.cooldowns[enemyAbility.key] ?? 0}</span>{enemyRoot > 0 ? <span>ROOT: {enemyRoot}</span> : null}</article>
      </section>

      <div className={styles.toolbar} data-wl-surface="raised">
        <button type="button" disabled={playerRoot > 0 || finished} onClick={() => { clearAction(); setMessage(`Movimento: ${movement}/${PLAYER_MOVE}.`); }}>Movimento · {movement}/{PLAYER_MOVE}</button>
        <button type="button" disabled={usedBasic || finished} data-wl-action={action?.kind === "basic" ? "primary" : undefined} onClick={() => selectAction({ kind: "basic", name: "Ataque Básico", range: character.basicAttackRange, area: 0 })}>Ataque · {usedBasic ? "USADO" : "DISPONÍVEL"}</button>
        <button type="button" disabled={finished} onClick={executeEnemyTurn}>Encerrar turno → IA</button>
        <button type="button" onClick={() => resetBoard()}>Reiniciar</button>
      </div>

      <div className={styles.skillBar} data-wl-surface="raised">
        {character.skills.map(({ source, skill }) => {
          const sourceUsed = isSourceUsed(source);
          const cooldown = player.cooldowns[skill.key] ?? 0;
          return <button key={`${source}-${skill.key}`} type="button" disabled={sourceUsed || cooldown > 0 || finished} data-selected={action?.kind === "skill" && action.skill.key === skill.key ? "true" : "false"} onClick={() => selectAction({ kind: "skill", name: skill.name, range: skill.range, area: skill.area, source, skill })}><strong>{skill.name}</strong><span>{source === "class" ? "Classe" : "Raça"} · Alcance {skill.range} · Área {skill.area}</span><small>{cooldown > 0 ? `Cooldown ${cooldown}` : skill.cost ? `${skill.cost} ${skill.resource}` : "Sem custo"}</small><small>{skill.operations.map((operation) => `${operation.operation}:${operation.target}`).join(" → ")}</small></button>;
        })}
        {character.items.map((item) => <button key={item.id} type="button" disabled={usedItem || finished} onClick={() => useItem(item)}><strong>{item.name}</strong><span>Item · 1 por turno</span><small>{usedItem ? "USADO" : "DISPONÍVEL"}</small></button>)}
      </div>

      <div className={styles.workspace}>
        <div className={styles.boardShell} data-wl-surface="dark"><div className={styles.board} style={{ gridTemplateColumns: `repeat(${GRID.width}, minmax(0, 1fr))` }}>{cells.map((position) => {
          const key = tacticalPositionKey(position);
          const isPlayer = key === tacticalPositionKey(playerPosition);
          const isEnemy = key === tacticalPositionKey(enemyPosition);
          const isObstacle = obstacles.has(key);
          const isReachable = !action && reachable.has(key);
          const inRange = Boolean(action && getTacticalDistance(playerPosition, position) <= action.range);
          const isArea = areaCells.has(key);
          const state = isPlayer ? "player" : isEnemy ? "enemy" : isObstacle ? "obstacle" : isArea ? "area" : isReachable ? "reachable" : inRange ? "range" : "empty";
          return <button key={key} type="button" className={styles.cell} data-state={state} onClick={() => clickCell(position)} aria-label={isPlayer ? player.name : isEnemy ? "Sentinela Rúnica" : isObstacle ? "Obstáculo" : `Casa ${position.x + 1}, ${position.y + 1}`}>{isPlayer ? <span className={styles.unit}>♞</span> : null}{isEnemy ? <span className={styles.unit}>♜</span> : null}{isObstacle ? <span className={styles.obstacle}>◆</span> : null}</button>;
        })}</div></div>
        <aside className={styles.sidePanel} data-wl-surface="raised">
          <div><span className={styles.eyebrow}>Economia do turno</span><h2>1 + 1 + 1 + 1</h2></div>
          <ul><li>Ataque Básico: {usedBasic ? "usado" : "disponível"}</li><li>Classe: {usedClass ? "usada" : "disponível"}</li><li>Raça: {usedRace ? "usada" : "disponível"}</li><li>Item: {character.items.length ? usedItem ? "usado" : "disponível" : "nenhum"}</li><li>IA: {profile} · {enemyAbility.name}</li></ul>
          {action?.kind === "skill" ? <div className={styles.actionDetails}><small>Ação selecionada</small><strong>{action.name}</strong><span>{action.skill.operations.map((operation) => `${operation.operation}:${operation.target}`).join(" · ")}</span></div> : null}
          <p className={styles.message} role="status">{message}</p>
          <div className={styles.combatLog}><small>LOG</small>{log.map((entry, index) => <p key={`${index}-${entry}`}>{entry}</p>)}</div>
        </aside>
      </div>
    </section>
  );
}
