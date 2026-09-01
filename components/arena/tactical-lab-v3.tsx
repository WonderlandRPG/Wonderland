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
import { chooseTacticalAiDestination } from "@/lib/game/tactical-ai";
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
type Action =
  | { kind: "basic"; range: number; name: string; area: 0 }
  | { kind: "skill"; range: number; area: number; name: string; source: SkillSource; skill: ClassSkill };

const GRID = { width: 10, height: 8 } as const;
const PLAYER_MOVE = 4;
const ENEMY_MOVE = 3;
const ENEMY_BASIC_RANGE = 1;
const START_PLAYER = { x: 2, y: 5 } as TacticalPosition;
const START_ENEMY = { x: 7, y: 2 } as TacticalPosition;
const obstacles = new Set(["4,1", "4,2", "4,3", "5,3", "6,3", "2,2", "7,5", "7,6"]);

const ENEMY_SKILL: ClassSkill = {
  key: "rajada-runica-tactical-test",
  name: "Rajada Rúnica",
  level: 1,
  category: "Ofensiva",
  type: "Ativa",
  effect: "Dispara energia rúnica e imobiliza o alvo.",
  kind: "damage",
  damageType: "magic",
  target: "enemy",
  resource: "none",
  resourceKey: "class",
  cost: 0,
  cooldown: 2,
  range: 3,
  area: 0,
  duration: 1,
  scaling: [{ attribute: "INT", multiplier: 0.85 }],
  reachText: "Até 3 casas",
  conditions: [],
  systemRule: "Dano mágico seguido de Root por 1 turno.",
  playerDescription: "Rajada Rúnica: dano mágico e Root por 1 turno.",
  chance: 100,
  maxStacks: 1,
  operations: [
    {
      operation: "DAMAGE",
      target: "enemy",
      base: 35,
      scaling: [{ attribute: "INT", multiplier: 0.85 }],
      damageType: "magic",
      status: "",
      duration: 0,
      chance: 100,
      stacks: 0,
      maxStacks: 0,
      distance: 0,
      modifiers: [],
    },
    {
      operation: "ROOT",
      target: "enemy",
      base: 0,
      scaling: [],
      damageType: "none",
      status: "enraizado-runico",
      duration: 1,
      chance: 100,
      stacks: 1,
      maxStacks: 1,
      distance: 0,
      modifiers: [],
    },
  ],
};

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
    id: "tactical-sentinel",
    name: "Sentinela Rúnica",
    attributes: {
      FOR: Math.max(70, Math.round(character.attributes.FOR * 0.7)),
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
    return /root|enraiz|imobil/.test(text) ? Math.max(max, status.duration) : max;
  }, 0);
}

function percent(current: number, max: number) {
  return max <= 0 ? 0 : Math.max(0, Math.min(100, (current / max) * 100));
}

function enemyAffecting(skill: ClassSkill) {
  return skill.operations.some((op) => op.target === "enemy" || op.target === "area");
}

export function TacticalLabV3({ characters }: { characters: TacticalCharacter[] }) {
  const first = characters[0];
  const [characterId, setCharacterId] = useState(first?.id ?? "");
  const character = characters.find((entry) => entry.id === characterId) ?? first;
  const [playerPos, setPlayerPos] = useState<TacticalPosition>(START_PLAYER);
  const [enemyPos, setEnemyPos] = useState<TacticalPosition>(START_ENEMY);
  const [player, setPlayer] = useState<CombatantState | null>(() => first ? makePlayer(first) : null);
  const [enemy, setEnemy] = useState<CombatantState | null>(() => first ? makeEnemy(first) : null);
  const [move, setMove] = useState(PLAYER_MOVE);
  const [action, setAction] = useState<Action | null>(null);
  const [areaCenter, setAreaCenter] = useState<TacticalPosition | null>(null);
  const [usedBasic, setUsedBasic] = useState(false);
  const [usedClass, setUsedClass] = useState(false);
  const [usedRace, setUsedRace] = useState(false);
  const [usedItem, setUsedItem] = useState(false);
  const [round, setRound] = useState(1);
  const [message, setMessage] = useState("Motor tático V3 pronto.");
  const [log, setLog] = useState<string[]>(["V3: habilidades determinísticas + IA com habilidade própria."]);

  const occupied = useMemo(() => new Set([tacticalPositionKey(enemyPos)]), [enemyPos]);
  const reachable = useMemo(() => getReachableTacticalCells({
    start: playerPos,
    blocked: new Set([...obstacles, ...occupied]),
    movement: move,
    grid: GRID,
  }), [playerPos, occupied, move]);
  const area = useMemo(() => action && areaCenter ? getTacticalAreaCells({ center: areaCenter, radius: action.area, grid: GRID }) : new Set<string>(), [action, areaCenter]);
  const cells = useMemo(() => Array.from({ length: GRID.width * GRID.height }, (_, i) => ({ x: i % GRID.width, y: Math.floor(i / GRID.width) })), []);

  if (!character || !player || !enemy) return <section className={styles.empty}>Nenhum personagem disponível.</section>;

  const playerRoot = rootTurns(player);
  const enemyRoot = rootTurns(enemy);
  const finished = player.hp <= 0 || enemy.hp <= 0;

  function addLog(text: string) { setLog((current) => [text, ...current].slice(0, 14)); }
  function used(source: SkillSource) { return source === "class" ? usedClass : usedRace; }
  function clearAction() { setAction(null); setAreaCenter(null); }

  function selectAction(next: Action) {
    if (finished) return setMessage("O combate terminou. Reinicie o mapa.");
    if (next.kind === "basic" && usedBasic) return setMessage("Ataque Básico já usado neste turno.");
    if (next.kind === "skill") {
      if (used(next.source)) return setMessage(`Habilidade de ${next.source === "class" ? "Classe" : "Raça"} já usada neste turno.`);
      const cd = player.cooldowns[next.skill.key] ?? 0;
      if (cd > 0) return setMessage(`${next.name} está em cooldown por ${cd} turno(s).`);
    }
    setAction(next);
    setAreaCenter(null);
    setMessage(`${next.name} selecionado.`);
  }

  function executePlayerSkill(selected: Extract<Action, { kind: "skill" }>, center: TacticalPosition) {
    const affectsEnemy = enemyAffecting(selected.skill);
    if (selected.area > 0 && affectsEnemy) {
      const affected = getTacticalAreaCells({ center, radius: selected.area, grid: GRID });
      if (!affected.has(tacticalPositionKey(enemyPos))) return setMessage("A área não atingiu a Sentinela.");
    }

    const result = resolveTacticalSkill(player, enemy, selected.skill);
    if (result.event.kind === "error") return setMessage(result.event.message);
    let nextPlayerPos = playerPos;
    let nextEnemyPos = enemyPos;
    const spatial: string[] = [];

    for (const op of selected.skill.operations) {
      const distance = Math.max(1, op.distance || 1);
      if (op.operation === "PUSH" && (op.target === "enemy" || op.target === "area")) {
        const forced = getForcedMovementDestination({
          source: playerPos,
          target: nextEnemyPos,
          distance,
          blocked: new Set([...obstacles, tacticalPositionKey(nextPlayerPos)]),
          grid: GRID,
        });
        nextEnemyPos = forced.position;
        spatial.push(forced.moved ? `Push ${forced.moved} casa(s).` : "Push bloqueado.");
      }
      if ((op.operation === "MOVE" || op.operation === "TELEPORT") && (op.target === "self" || op.target === "source")) {
        const key = tacticalPositionKey(center);
        if (!obstacles.has(key) && key !== tacticalPositionKey(nextEnemyPos) && getTacticalDistance(playerPos, center) <= distance) {
          nextPlayerPos = center;
          spatial.push(`${op.operation}: ${center.x + 1},${center.y + 1}.`);
        }
      }
    }

    setPlayer(result.actor);
    setEnemy(result.target);
    setPlayerPos(nextPlayerPos);
    setEnemyPos(nextEnemyPos);
    if (selected.source === "class") setUsedClass(true); else setUsedRace(true);
    const text = `${result.event.message}${spatial.length ? ` ${spatial.join(" ")}` : ""}`;
    setMessage(text);
    addLog(text);
    clearAction();
  }

  function clickCell(pos: TacticalPosition) {
    const key = tacticalPositionKey(pos);
    if (!action) {
      if (playerRoot > 0) return setMessage(`Você está imobilizado por ${playerRoot} turno(s).`);
      if (!reachable.has(key)) return;
      const cost = reachable.get(key) ?? 0;
      setPlayerPos(pos);
      setMove((value) => Math.max(0, value - cost));
      return setMessage(`Movimento: ${cost} ponto(s) consumidos.`);
    }

    if (obstacles.has(key)) return setMessage("Essa casa está bloqueada.");
    const distance = getTacticalDistance(playerPos, pos);
    if (distance > action.range) return setMessage(`${action.name}: fora do alcance (${distance}/${action.range}).`);

    if (action.kind === "basic") {
      if (key !== tacticalPositionKey(enemyPos)) return setMessage("Selecione a Sentinela.");
      if (!hasTacticalLineOfSight({ from: playerPos, to: enemyPos, blocked: obstacles })) return setMessage("Linha de visão bloqueada.");
      const result = resolveBasicAttack(player, enemy);
      setPlayer(result.actor); setEnemy(result.target); setUsedBasic(true); setMessage(result.event.message); addLog(result.event.message); clearAction();
      return;
    }

    const affectsEnemy = enemyAffecting(action.skill);
    if (affectsEnemy && action.area <= 0 && key !== tacticalPositionKey(enemyPos)) return setMessage("Selecione a Sentinela.");
    if (affectsEnemy && !hasTacticalLineOfSight({ from: playerPos, to: pos, blocked: obstacles })) return setMessage(`${action.name}: linha de visão bloqueada.`);
    executePlayerSkill(action, pos);
  }

  function useItem(item: TacticalItem) {
    if (usedItem || finished) return;
    const healed = Math.min(Math.max(25, Math.round(player.maxHp * 0.25)), player.maxHp - player.hp);
    setPlayer({ ...player, hp: player.hp + healed });
    setUsedItem(true);
    const text = `${player.name} usou ${item.name} e recuperou ${healed} HP. Item real preservado.`;
    setMessage(text); addLog(text);
  }

  function enemyTurn() {
    if (finished) return;
    let nextEnemy = enemy;
    let nextPlayer = player;
    let nextPos = enemyPos;
    const notes = [`Rodada ${round}: Sentinela.`];
    const skillCd = nextEnemy.cooldowns[ENEMY_SKILL.key] ?? 0;
    const skillAvailable = skillCd <= 0;

    if (enemyRoot > 0) {
      notes.push(`Imobilizada (${enemyRoot}).`);
    } else {
      const decision = chooseTacticalAiDestination({
        start: enemyPos,
        target: playerPos,
        movement: ENEMY_MOVE,
        grid: GRID,
        blocked: new Set([...obstacles, tacticalPositionKey(playerPos)]),
        sightBlocked: obstacles,
        basicRange: ENEMY_BASIC_RANGE,
        skillRange: ENEMY_SKILL.range,
        skillAvailable,
      });
      nextPos = decision.position;
      notes.push(decision.movementCost > 0 ? `Moveu ${decision.movementCost} casa(s) para ${decision.reason}.` : `Manteve posição: ${decision.reason}.`);
    }

    const distance = getTacticalDistance(nextPos, playerPos);
    const sight = hasTacticalLineOfSight({ from: nextPos, to: playerPos, blocked: obstacles });
    if (skillAvailable && distance <= ENEMY_SKILL.range && sight) {
      const result = resolveTacticalSkill(nextEnemy, nextPlayer, ENEMY_SKILL);
      nextEnemy = result.actor;
      nextPlayer = result.target;
      notes.push(result.event.message);
    } else if (distance <= ENEMY_BASIC_RANGE && sight) {
      const result = resolveBasicAttack(nextEnemy, nextPlayer);
      nextEnemy = result.actor;
      nextPlayer = result.target;
      notes.push(result.event.message);
    } else {
      notes.push(`Sem ataque válido. Distância ${distance}.`);
    }

    nextPlayer = tickCooldowns(nextPlayer);
    nextEnemy = tickCooldowns(nextEnemy);
    setEnemyPos(nextPos); setPlayer(nextPlayer); setEnemy(nextEnemy);
    setMove(PLAYER_MOVE); setUsedBasic(false); setUsedClass(false); setUsedRace(false); setUsedItem(false); setRound((value) => value + 1); clearAction();
    notes.forEach(addLog);
    setMessage(nextPlayer.hp <= 0 ? `${nextPlayer.name} foi derrotado.` : `${notes.join(" ")} Seu turno.`);
  }

  function reset(nextCharacter = character) {
    setPlayerPos(START_PLAYER); setEnemyPos(START_ENEMY); setPlayer(makePlayer(nextCharacter)); setEnemy(makeEnemy(nextCharacter)); setMove(PLAYER_MOVE);
    setUsedBasic(false); setUsedClass(false); setUsedRace(false); setUsedItem(false); setRound(1); clearAction(); setLog(["Mapa V3 reiniciado."]); setMessage("Mapa reiniciado.");
  }

  function changeCharacter(id: string) {
    const next = characters.find((entry) => entry.id === id);
    if (!next) return;
    setCharacterId(id); reset(next);
  }

  return <section className={styles.lab} aria-label="Laboratório do mapa tático V3">
    <header className={styles.header}><div><span className={styles.eyebrow}>Somente ADM · motor tático V3</span><h1>Laboratório do Mapa Tático</h1><p>Habilidades determinísticas e IA capaz de procurar posições de ataque e usar habilidade própria.</p></div><div className={styles.status}><small>Protótipo</small><strong>V3 · Rodada {round}</strong></div></header>

    <section className={styles.characterPanel} data-wl-surface="raised"><label><span>Personagem</span><select value={character.id} onChange={(event) => changeCharacter(event.target.value)}>{characters.map((entry) => <option key={entry.id} value={entry.id}>{entry.name} · Nv. {entry.level} · {entry.className}</option>)}</select></label><div className={styles.characterSummary}><strong>{character.name}</strong><span>{character.raceName} · {character.className} · Rank {character.rank}</span><span>HP {player.hp}/{player.maxHp} · Mana {player.mana}/{player.maxMana}</span></div><div className={styles.attributes}>{Object.entries(character.attributes).map(([key, value]) => <span key={key}><small>{key}</small><strong>{value}</strong></span>)}</div></section>

    <section className={styles.combatHud}><article><small>AVENTUREIRO</small><strong>{player.name}</strong><div className={styles.bar}><i style={{ width: `${percent(player.hp, player.maxHp)}%` }} /></div><span>HP {player.hp}/{player.maxHp}</span>{player.maxMana > 0 ? <span>Mana {player.mana}/{player.maxMana}</span> : null}{playerRoot > 0 ? <span>ROOT: {playerRoot}</span> : null}</article><article data-enemy="true"><small>IA TÁTICA</small><strong>Sentinela Rúnica</strong><div className={styles.bar}><i style={{ width: `${percent(enemy.hp, enemy.maxHp)}%` }} /></div><span>HP {enemy.hp}/{enemy.maxHp}</span><span>Rajada Rúnica: CD {enemy.cooldowns[ENEMY_SKILL.key] ?? 0}</span>{enemyRoot > 0 ? <span>ROOT: {enemyRoot}</span> : null}</article></section>

    <div className={styles.toolbar} data-wl-surface="raised"><button type="button" disabled={playerRoot > 0 || finished} onClick={() => { clearAction(); setMessage(`Movimento: ${move}/${PLAYER_MOVE}.`); }}>Movimento · {move}/{PLAYER_MOVE}</button><button type="button" disabled={usedBasic || finished} data-wl-action={action?.kind === "basic" ? "primary" : undefined} onClick={() => selectAction({ kind: "basic", name: "Ataque Básico", range: character.basicAttackRange, area: 0 })}>Ataque · {usedBasic ? "USADO" : "DISPONÍVEL"}</button><button type="button" disabled={finished} onClick={enemyTurn}>Encerrar turno → IA</button><button type="button" onClick={() => reset()}>Reiniciar</button></div>

    <div className={styles.skillBar} data-wl-surface="raised">{character.skills.map(({ source, skill }) => { const isUsed = used(source); const cd = player.cooldowns[skill.key] ?? 0; return <button key={`${source}-${skill.key}`} type="button" disabled={isUsed || cd > 0 || finished} data-selected={action?.kind === "skill" && action.skill.key === skill.key ? "true" : "false"} onClick={() => selectAction({ kind: "skill", name: skill.name, range: skill.range, area: skill.area, source, skill })}><strong>{skill.name}</strong><span>{source === "class" ? "Classe" : "Raça"} · Alcance {skill.range} · Área {skill.area}</span><small>{cd > 0 ? `Cooldown ${cd}` : skill.cost ? `${skill.cost} ${skill.resource}` : "Sem custo"}</small><small>{skill.operations.map((op) => `${op.operation}:${op.target}`).join(" → ")}</small></button>; })}{character.items.map((item) => <button key={item.id} type="button" disabled={usedItem || finished} onClick={() => useItem(item)}><strong>{item.name}</strong><span>Item · 1 por turno</span><small>{usedItem ? "USADO" : "DISPONÍVEL"}</small></button>)}</div>

    <div className={styles.workspace}><div className={styles.boardShell} data-wl-surface="dark"><div className={styles.board} style={{ gridTemplateColumns: `repeat(${GRID.width}, minmax(0, 1fr))` }}>{cells.map((pos) => { const key = tacticalPositionKey(pos); const isPlayer = key === tacticalPositionKey(playerPos); const isEnemy = key === tacticalPositionKey(enemyPos); const isObstacle = obstacles.has(key); const isReachable = !action && reachable.has(key); const inRange = action && getTacticalDistance(playerPos, pos) <= action.range; const isArea = area.has(key); const state = isPlayer ? "player" : isEnemy ? "enemy" : isObstacle ? "obstacle" : isArea ? "area" : isReachable ? "reachable" : inRange ? "range" : "empty"; return <button key={key} type="button" className={styles.cell} data-state={state} onClick={() => clickCell(pos)} aria-label={isPlayer ? player.name : isEnemy ? "Sentinela Rúnica" : isObstacle ? "Obstáculo" : `Casa ${pos.x + 1}, ${pos.y + 1}`}>{isPlayer ? <span className={styles.unit}>♞</span> : null}{isEnemy ? <span className={styles.unit}>♜</span> : null}{isObstacle ? <span className={styles.obstacle}>◆</span> : null}</button>; })}</div></div><aside className={styles.sidePanel} data-wl-surface="raised"><div><span className={styles.eyebrow}>Economia do turno</span><h2>1 + 1 + 1 + 1</h2></div><ul><li>Ataque Básico: {usedBasic ? "usado" : "disponível"}</li><li>Classe: {usedClass ? "usada" : "disponível"}</li><li>Raça: {usedRace ? "usada" : "disponível"}</li><li>Item: {character.items.length ? usedItem ? "usado" : "disponível" : "nenhum"}</li><li>IA: habilidade antes de ataque quando houver posição válida.</li></ul>{action?.kind === "skill" ? <div className={styles.actionDetails}><small>Ação selecionada</small><strong>{action.name}</strong><span>{action.skill.operations.map((op) => `${op.operation}:${op.target}`).join(" · ")}</span></div> : null}<p className={styles.message} role="status">{message}</p><div className={styles.combatLog}><small>LOG</small>{log.map((entry, index) => <p key={`${index}-${entry}`}>{entry}</p>)}</div></aside></div>
  </section>;
}
