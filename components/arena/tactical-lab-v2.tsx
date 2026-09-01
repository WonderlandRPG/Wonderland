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
  getForcedMovementDestination,
  getReachableTacticalCells,
  getTacticalAreaCells,
  getTacticalDistance,
  hasTacticalLineOfSight,
  isTacticalPositionInside,
  tacticalPositionKey,
  type TacticalPosition,
} from "@/lib/game/tactical-grid";
import { resolveTacticalSkill } from "@/lib/game/tactical-skill";

type OverlayMode = "movement" | "range" | "none";
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
  basicAttackDamageType: "physical" | "magic";
  skills: Array<{ source: SkillSource; skill: ClassSkill }>;
  items: TacticalItem[];
};

type SelectedAction =
  | { kind: "basic"; name: string; range: number; area: 0 }
  | { kind: "skill"; name: string; range: number; area: number; source: SkillSource; skill: ClassSkill };

const GRID = { width: 10, height: 8 } as const;
const MOVE_LIMIT = 4;
const ENEMY_MOVE_LIMIT = 3;
const ENEMY_ATTACK_RANGE = 1;
const START_PLAYER: TacticalPosition = { x: 2, y: 5 };
const START_ENEMY: TacticalPosition = { x: 7, y: 2 };
const obstacleKeys = new Set(["4,1", "4,2", "4,3", "5,3", "6,3", "2,2", "7,5", "7,6"]);

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
    id: "tactical-test-enemy",
    name: "Sentinela Rúnica",
    attributes: character.attributes,
    baseHp: 500,
    baseMana: 0,
    usesMana: false,
  });
}

function percent(current: number, maximum: number) {
  return maximum <= 0 ? 0 : Math.max(0, Math.min(100, (current / maximum) * 100));
}

function rootTurns(combatant: CombatantState) {
  return Object.entries(combatant.statuses).reduce((maximum, [key, status]) => {
    const text = `${key} ${status.name}`.toLowerCase();
    return /root|enraiz|imobil/.test(text) ? Math.max(maximum, status.duration) : maximum;
  }, 0);
}

function hasEnemyOperation(skill: ClassSkill) {
  return skill.operations.some((operation) =>
    (operation.target === "enemy" || operation.target === "area") &&
    !["MOVE", "TELEPORT"].includes(operation.operation),
  );
}

function hasSelfMovement(skill: ClassSkill) {
  return skill.operations.some((operation) =>
    (operation.operation === "MOVE" || operation.operation === "TELEPORT") &&
    (operation.target === "self" || operation.target === "source"),
  );
}

function chooseClosestReachable(
  from: TacticalPosition,
  toward: TacticalPosition,
  movement: number,
  blocked: ReadonlySet<string>,
) {
  const reachable = getReachableTacticalCells({ start: from, blocked, movement, grid: GRID });
  const candidates = [from, ...Array.from(reachable.keys()).map((key) => {
    const [x, y] = key.split(",").map(Number);
    return { x, y };
  })];
  candidates.sort((a, b) => getTacticalDistance(a, toward) - getTacticalDistance(b, toward));
  return candidates[0] ?? from;
}

function chooseEnemyDestination(enemy: TacticalPosition, player: TacticalPosition) {
  return chooseClosestReachable(
    enemy,
    player,
    ENEMY_MOVE_LIMIT,
    new Set([...obstacleKeys, tacticalPositionKey(player)]),
  );
}

function teleportToward(from: TacticalPosition, toward: TacticalPosition, distance: number, blocked: ReadonlySet<string>) {
  const candidates: TacticalPosition[] = [];
  for (let y = 0; y < GRID.height; y += 1) {
    for (let x = 0; x < GRID.width; x += 1) {
      const position = { x, y };
      if (getTacticalDistance(from, position) > distance) continue;
      if (blocked.has(tacticalPositionKey(position))) continue;
      candidates.push(position);
    }
  }
  candidates.sort((a, b) => getTacticalDistance(a, toward) - getTacticalDistance(b, toward));
  return candidates[0] ?? from;
}

export function TacticalLabV2({ characters }: { characters: TacticalCharacter[] }) {
  const first = characters[0];
  const [selectedCharacterId, setSelectedCharacterId] = useState(first?.id ?? "");
  const character = characters.find((entry) => entry.id === selectedCharacterId) ?? first;
  const [playerPosition, setPlayerPosition] = useState<TacticalPosition>(START_PLAYER);
  const [enemyPosition, setEnemyPosition] = useState<TacticalPosition>(START_ENEMY);
  const [overlay, setOverlay] = useState<OverlayMode>("movement");
  const [remainingMove, setRemainingMove] = useState(MOVE_LIMIT);
  const [selectedAction, setSelectedAction] = useState<SelectedAction | null>(null);
  const [areaCenter, setAreaCenter] = useState<TacticalPosition | null>(null);
  const [playerCombat, setPlayerCombat] = useState<CombatantState | null>(() => first ? makePlayer(first) : null);
  const [enemyCombat, setEnemyCombat] = useState<CombatantState | null>(() => first ? makeEnemy(first) : null);
  const [usedBasic, setUsedBasic] = useState(false);
  const [usedClass, setUsedClass] = useState(false);
  const [usedRace, setUsedRace] = useState(false);
  const [usedItem, setUsedItem] = useState(false);
  const [round, setRound] = useState(1);
  const [message, setMessage] = useState("Selecione uma casa verde para mover o aventureiro.");
  const [log, setLog] = useState<string[]>(["Motor tático V2 iniciado. Todas as operações de skill são executadas em ordem."]);

  const occupied = useMemo(() => new Set([tacticalPositionKey(enemyPosition)]), [enemyPosition]);
  const reachable = useMemo(
    () => getReachableTacticalCells({
      start: playerPosition,
      blocked: new Set([...obstacleKeys, ...occupied]),
      movement: remainingMove,
      grid: GRID,
    }),
    [playerPosition, occupied, remainingMove],
  );
  const areaCells = useMemo(
    () => areaCenter && selectedAction
      ? getTacticalAreaCells({ center: areaCenter, radius: selectedAction.area, grid: GRID })
      : new Set<string>(),
    [areaCenter, selectedAction],
  );
  const cells = useMemo(
    () => Array.from({ length: GRID.width * GRID.height }, (_, index) => ({
      x: index % GRID.width,
      y: Math.floor(index / GRID.width),
    })),
    [],
  );

  if (!character || !playerCombat || !enemyCombat) {
    return <section className={styles.empty}>Nenhum personagem disponível para o laboratório.</section>;
  }

  const activePlayer = playerCombat;
  const activeEnemy = enemyCombat;
  const defeated = activeEnemy.hp <= 0;
  const playerDefeated = activePlayer.hp <= 0;
  const playerRooted = rootTurns(activePlayer);
  const enemyRooted = rootTurns(activeEnemy);

  function pushLog(text: string) {
    setLog((current) => [text, ...current].slice(0, 12));
  }

  function clearSelection() {
    setSelectedAction(null);
    setAreaCenter(null);
  }

  function actionUsed(source: SkillSource) {
    return source === "class" ? usedClass : usedRace;
  }

  function beginMovement() {
    if (defeated || playerDefeated) return setMessage("O combate terminou. Reinicie o mapa.");
    if (playerRooted > 0) return setMessage(`${activePlayer.name} está imobilizado por ${playerRooted} turno(s).`);
    clearSelection();
    setOverlay("movement");
    setMessage(remainingMove > 0 ? `Restam ${remainingMove} ponto(s) de movimento.` : "Sem movimento restante neste turno.");
  }

  function selectAction(action: SelectedAction) {
    if (defeated || playerDefeated) return setMessage("O combate terminou. Reinicie o mapa.");
    if (action.kind === "basic" && usedBasic) return setMessage("O Ataque Básico já foi usado neste turno.");
    if (action.kind === "skill") {
      if (actionUsed(action.source)) return setMessage(`A habilidade de ${action.source === "class" ? "Classe" : "Raça"} já foi usada neste turno.`);
      const cooldown = activePlayer.cooldowns[action.skill.key] ?? 0;
      if (cooldown > 0) return setMessage(`${action.skill.name} está em cooldown por ${cooldown} turno(s).`);
    }
    setSelectedAction(action);
    setAreaCenter(null);
    setOverlay("range");
    setMessage(`${action.name} selecionado. Escolha a casa/alvo destacado.`);
  }

  function applySpatialOperations(skill: ClassSkill, center: TacticalPosition) {
    const notes: string[] = [];
    const enemyEffects = hasEnemyOperation(skill);

    for (const operation of skill.operations) {
      const distance = Math.max(1, operation.distance || 1);

      if (operation.operation === "PUSH" && (operation.target === "enemy" || operation.target === "area")) {
        const forced = getForcedMovementDestination({
          source: playerPosition,
          target: enemyPosition,
          distance,
          blocked: new Set([...obstacleKeys, tacticalPositionKey(playerPosition)]),
          grid: GRID,
        });
        setEnemyPosition(forced.position);
        notes.push(forced.moved > 0 ? `Sentinela empurrada ${forced.moved} casa(s).` : "Empurrão bloqueado pelo terreno.");
      }

      if ((operation.operation === "MOVE" || operation.operation === "TELEPORT") && (operation.target === "self" || operation.target === "source")) {
        let destination = center;
        if (enemyEffects) {
          const blocked = new Set([...obstacleKeys, tacticalPositionKey(enemyPosition)]);
          destination = operation.operation === "TELEPORT"
            ? teleportToward(playerPosition, enemyPosition, distance, blocked)
            : chooseClosestReachable(playerPosition, enemyPosition, distance, blocked);
        }
        if (isTacticalPositionInside(destination, GRID) && !obstacleKeys.has(tacticalPositionKey(destination)) && tacticalPositionKey(destination) !== tacticalPositionKey(enemyPosition)) {
          setPlayerPosition(destination);
          notes.push(`${operation.operation === "TELEPORT" ? "Teleporte" : "Movimento especial"}: casa ${destination.x + 1},${destination.y + 1}.`);
        }
      }
    }

    notes.forEach(pushLog);
    return notes;
  }

  function applyBasicAttack() {
    const result = resolveBasicAttack(activePlayer, activeEnemy);
    setPlayerCombat(result.actor);
    setEnemyCombat(result.target);
    setUsedBasic(true);
    setMessage(result.event.message);
    pushLog(result.event.message);
    if (result.target.hp <= 0) pushLog("Sentinela Rúnica derrotada.");
  }

  function applySkill(action: Extract<SelectedAction, { kind: "skill" }>, center: TacticalPosition) {
    if (actionUsed(action.source)) return setMessage(`A ação de ${action.source === "class" ? "Classe" : "Raça"} já foi usada.`);

    const enemyEffects = hasEnemyOperation(action.skill);
    if (action.area > 0 && enemyEffects) {
      const affected = getTacticalAreaCells({ center, radius: action.area, grid: GRID });
      if (!affected.has(tacticalPositionKey(enemyPosition))) {
        return setMessage(`${action.name}: a área escolhida não atingiu a Sentinela Rúnica.`);
      }
    }

    const result = resolveTacticalSkill(activePlayer, activeEnemy, action.skill);
    if (result.event.kind === "error") return setMessage(result.event.message);

    setPlayerCombat(result.actor);
    setEnemyCombat(result.target);
    const spatialNotes = applySpatialOperations(action.skill, center);
    if (action.source === "class") setUsedClass(true);
    else setUsedRace(true);

    const text = `${result.event.message}${spatialNotes.length ? ` ${spatialNotes.join(" ")}` : ""}`;
    setMessage(text);
    pushLog(result.event.message);
    if (result.target.hp <= 0) pushLog("Sentinela Rúnica derrotada.");
  }

  function useItem(item: TacticalItem) {
    if (usedItem) return setMessage("O Item já foi usado neste turno.");
    const amount = Math.min(Math.max(25, Math.round(activePlayer.maxHp * 0.25)), activePlayer.maxHp - activePlayer.hp);
    setPlayerCombat({ ...activePlayer, hp: activePlayer.hp + amount });
    setUsedItem(true);
    const text = `${activePlayer.name} usou ${item.name} e recuperou ${amount} de HP. O item real não foi consumido.`;
    setMessage(text);
    pushLog(text);
  }

  function handleCellClick(position: TacticalPosition) {
    const cellKey = tacticalPositionKey(position);

    if (overlay === "movement" && reachable.has(cellKey)) {
      if (playerRooted > 0) return setMessage(`${activePlayer.name} está imobilizado e não pode se mover.`);
      const cost = reachable.get(cellKey) ?? 0;
      setPlayerPosition(position);
      setRemainingMove((current) => Math.max(0, current - cost));
      return setMessage(`Movimento validado: ${cost} ponto(s) consumido(s).`);
    }

    if (obstacleKeys.has(cellKey)) return setMessage("Ação bloqueada: existe um obstáculo nessa casa.");
    if (overlay !== "range" || !selectedAction) {
      if (cellKey === tacticalPositionKey(playerPosition)) beginMovement();
      return;
    }

    const distance = getTacticalDistance(playerPosition, position);
    if (distance > selectedAction.range) return setMessage(`${selectedAction.name}: fora do alcance (${distance}/${selectedAction.range}).`);

    if (selectedAction.kind === "basic") {
      if (cellKey !== tacticalPositionKey(enemyPosition)) return setMessage("Ataque Básico precisa selecionar a criatura.");
      if (!hasTacticalLineOfSight({ from: playerPosition, to: enemyPosition, blocked: obstacleKeys })) return setMessage("Ataque Básico: linha de visão bloqueada.");
      setAreaCenter(position);
      applyBasicAttack();
      return;
    }

    const skill = selectedAction.skill;
    const enemyEffects = hasEnemyOperation(skill);
    const selfMove = hasSelfMovement(skill);
    const selfOnly = !enemyEffects && !selfMove;

    if (selfOnly && cellKey !== tacticalPositionKey(playerPosition)) return setMessage("Essa habilidade deve ser usada no próprio personagem.");
    if (enemyEffects && selectedAction.area <= 0 && cellKey !== tacticalPositionKey(enemyPosition)) return setMessage("Selecione a Sentinela Rúnica como alvo.");
    if (enemyEffects && !hasTacticalLineOfSight({ from: playerPosition, to: position, blocked: obstacleKeys })) return setMessage(`${skill.name}: linha de visão bloqueada.`);
    if (selfMove && !enemyEffects && cellKey === tacticalPositionKey(enemyPosition)) return setMessage("O destino está ocupado pela Sentinela.");

    setAreaCenter(position);
    applySkill(selectedAction, position);
  }

  function executeEnemyTurn() {
    let nextEnemy = activeEnemy;
    let nextPlayer = activePlayer;
    let nextPosition = enemyPosition;
    const notes = [`Rodada ${round}: turno da Sentinela Rúnica.`];

    if (enemyRooted > 0) {
      notes.push(`Sentinela está imobilizada (${enemyRooted} turno(s)).`);
    } else {
      nextPosition = chooseEnemyDestination(enemyPosition, playerPosition);
      const moved = getTacticalDistance(enemyPosition, nextPosition);
      notes.push(moved > 0 ? `Sentinela avançou ${moved} casa(s).` : "Sentinela manteve a posição.");
    }

    const distance = getTacticalDistance(nextPosition, playerPosition);
    const sight = hasTacticalLineOfSight({ from: nextPosition, to: playerPosition, blocked: obstacleKeys });
    if (distance <= ENEMY_ATTACK_RANGE && sight) {
      const result = resolveBasicAttack(nextEnemy, nextPlayer);
      nextEnemy = result.actor;
      nextPlayer = result.target;
      notes.push(result.event.message);
    } else {
      notes.push(`Sem ataque: distância ${distance}/${ENEMY_ATTACK_RANGE}.`);
    }

    nextPlayer = tickCooldowns(nextPlayer);
    nextEnemy = tickCooldowns(nextEnemy);
    setEnemyPosition(nextPosition);
    setPlayerCombat(nextPlayer);
    setEnemyCombat(nextEnemy);
    setRemainingMove(MOVE_LIMIT);
    setUsedBasic(false);
    setUsedClass(false);
    setUsedRace(false);
    setUsedItem(false);
    setRound((value) => value + 1);
    clearSelection();
    setOverlay("movement");
    notes.forEach(pushLog);
    setMessage(nextPlayer.hp <= 0 ? `${nextPlayer.name} foi derrotado.` : `${notes.join(" ")} Novo turno do jogador.`);
  }

  function resetBoard(nextCharacter = character) {
    setPlayerPosition(START_PLAYER);
    setEnemyPosition(START_ENEMY);
    setRemainingMove(MOVE_LIMIT);
    setUsedBasic(false);
    setUsedClass(false);
    setUsedRace(false);
    setUsedItem(false);
    setRound(1);
    setPlayerCombat(makePlayer(nextCharacter));
    setEnemyCombat(makeEnemy(nextCharacter));
    clearSelection();
    setOverlay("movement");
    setMessage("Tabuleiro e estados de combate reiniciados.");
    setLog(["Motor tático V2 reiniciado."]);
  }

  function changeCharacter(id: string) {
    const next = characters.find((entry) => entry.id === id);
    if (!next) return;
    setSelectedCharacterId(id);
    resetBoard(next);
    setMessage(`${next.name} carregado no laboratório.`);
  }

  return (
    <section className={styles.lab} aria-label="Laboratório do mapa tático V2">
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Somente administradores · motor tático V2</span>
          <h1>Laboratório do Mapa Tático</h1>
          <p>As habilidades agora executam cada operação estruturada individualmente, sem depender da ordem DAMAGE/MOVE/ROOT/BUFF.</p>
        </div>
        <div className={styles.status}><small>Estado do protótipo</small><strong>Resolvedor V2 · Rodada {round}</strong></div>
      </header>

      <section className={styles.characterPanel} data-wl-surface="raised">
        <label><span>Personagem de teste</span><select value={character.id} onChange={(event) => changeCharacter(event.target.value)}>{characters.map((entry) => <option key={entry.id} value={entry.id}>{entry.name} · Nv. {entry.level} · {entry.className}</option>)}</select></label>
        <div className={styles.characterSummary}><strong>{character.name}</strong><span>{character.raceName} · {character.className} · Rank {character.rank}</span><span>HP {activePlayer.hp}/{activePlayer.maxHp} · Mana {activePlayer.mana}/{activePlayer.maxMana}</span></div>
        <div className={styles.attributes}>{Object.entries(character.attributes).map(([key, value]) => <span key={key}><small>{key}</small><strong>{value}</strong></span>)}</div>
      </section>

      <section className={styles.combatHud}>
        <article><small>AVENTUREIRO</small><strong>{activePlayer.name}</strong><div className={styles.bar}><i style={{ width: `${percent(activePlayer.hp, activePlayer.maxHp)}%` }} /></div><span>HP {activePlayer.hp} / {activePlayer.maxHp}</span>{activePlayer.maxMana > 0 ? <span>Mana {activePlayer.mana} / {activePlayer.maxMana}</span> : null}{activePlayer.maxClassResource > 0 ? <span>{activePlayer.classResourceName}: {activePlayer.classResource}/{activePlayer.maxClassResource}</span> : null}{activePlayer.maxRaceResource > 0 ? <span>{activePlayer.raceResourceName}: {activePlayer.raceResource}/{activePlayer.maxRaceResource}</span> : null}{playerRooted > 0 ? <span>Imobilizado: {playerRooted}</span> : null}</article>
        <article data-enemy="true"><small>IA · ALVO DE TESTE</small><strong>Sentinela Rúnica</strong><div className={styles.bar}><i style={{ width: `${percent(activeEnemy.hp, activeEnemy.maxHp)}%` }} /></div><span>HP {activeEnemy.hp} / {activeEnemy.maxHp}</span><span>{defeated ? "DERROTADA" : enemyRooted > 0 ? `Imobilizada: ${enemyRooted}` : `Movimento ${ENEMY_MOVE_LIMIT} · Ataque ${ENEMY_ATTACK_RANGE}`}</span></article>
      </section>

      <div className={styles.toolbar} data-wl-surface="raised">
        <button type="button" disabled={playerRooted > 0 || playerDefeated} data-wl-action={overlay === "movement" ? "primary" : undefined} onClick={beginMovement}>Movimento · {remainingMove}/{MOVE_LIMIT}</button>
        <button type="button" disabled={usedBasic || defeated || playerDefeated} data-wl-action={selectedAction?.kind === "basic" ? "primary" : undefined} onClick={() => selectAction({ kind: "basic", name: "Ataque Básico", range: character.basicAttackRange, area: 0 })}>Ataque · {usedBasic ? "USADO" : "DISPONÍVEL"}</button>
        <button type="button" disabled={defeated || playerDefeated} onClick={executeEnemyTurn}>Encerrar turno → IA</button>
        <button type="button" onClick={() => { setOverlay("none"); clearSelection(); }}>Limpar marcações</button>
        <button type="button" onClick={() => resetBoard()}>Reiniciar mapa</button>
      </div>

      <div className={styles.skillBar} data-wl-surface="raised" aria-label="Habilidades reais">
        {character.skills.map(({ source, skill }) => {
          const cooldown = activePlayer.cooldowns[skill.key] ?? 0;
          const used = actionUsed(source);
          return <button key={`${source}-${skill.key}`} type="button" disabled={used || cooldown > 0 || defeated || playerDefeated} data-selected={selectedAction?.kind === "skill" && selectedAction.skill.key === skill.key ? "true" : "false"} onClick={() => selectAction({ kind: "skill", name: skill.name, range: skill.range, area: skill.area, source, skill })} title={skill.playerDescription}><strong>{skill.name}</strong><span>{source === "class" ? "Classe" : "Raça"} · Alcance {skill.range} · Área {skill.area}</span><small>{cooldown > 0 ? `Cooldown ${cooldown}` : skill.cost > 0 ? `${skill.cost} ${skill.resource}` : "Sem custo"}</small><small>Opera: {skill.operations.map((operation) => operation.operation).join(" → ")}</small></button>;
        })}
        {character.items.map((item) => <button key={item.id} type="button" disabled={usedItem || defeated || playerDefeated} onClick={() => useItem(item)} title={item.description}><strong>{item.name}</strong><span>Item ativo · 1 por turno</span><small>{usedItem ? "USADO" : "DISPONÍVEL"}</small></button>)}
      </div>

      <div className={styles.workspace}>
        <div className={styles.boardShell} data-wl-surface="dark"><div className={styles.board} style={{ gridTemplateColumns: `repeat(${GRID.width}, minmax(0, 1fr))` }}>{cells.map((position) => {
          const cellKey = tacticalPositionKey(position);
          const isPlayer = cellKey === tacticalPositionKey(playerPosition);
          const isEnemy = cellKey === tacticalPositionKey(enemyPosition);
          const isObstacle = obstacleKeys.has(cellKey);
          const isReachable = overlay === "movement" && reachable.has(cellKey);
          const isInRange = overlay === "range" && selectedAction && !isObstacle && getTacticalDistance(playerPosition, position) <= selectedAction.range;
          const isArea = areaCells.has(cellKey);
          const state = isPlayer ? "player" : isEnemy ? "enemy" : isObstacle ? "obstacle" : isArea ? "area" : isReachable ? "reachable" : isInRange ? "range" : "empty";
          return <button key={cellKey} type="button" className={styles.cell} data-state={state} onClick={() => handleCellClick(position)} aria-label={isPlayer ? character.name : isEnemy ? "Sentinela Rúnica" : isObstacle ? "Obstáculo" : `Casa ${position.x + 1}, ${position.y + 1}`}><span className={styles.unit}>{isPlayer ? "♞" : isEnemy ? "♜" : ""}</span>{isObstacle ? <span className={styles.obstacle}>◆</span> : null}</button>;
        })}</div></div>

        <aside className={styles.sidePanel} data-wl-surface="raised">
          <div><span className={styles.eyebrow}>Economia de turno</span><h2>Rodada {round}</h2></div>
          <ul><li>Movimento: {remainingMove}/{MOVE_LIMIT}</li><li>Ataque Básico: {usedBasic ? "usado" : "disponível"}</li><li>Habilidade de Classe: {usedClass ? "usada" : "disponível"}</li><li>Habilidade de Raça: {usedRace ? "usada" : "disponível"}</li><li>Item: {character.items.length ? (usedItem ? "usado" : "disponível") : "nenhum ativo"}</li></ul>
          {selectedAction ? <div className={styles.actionDetails}><small>Ação selecionada</small><strong>{selectedAction.name}</strong><span>Alcance {selectedAction.range} · Área {selectedAction.area}</span>{selectedAction.kind === "skill" ? <span>{selectedAction.skill.operations.map((operation) => `${operation.operation}:${operation.target}`).join(" · ")}</span> : null}</div> : null}
          <p className={styles.message} role="status">{message}</p>
          <div className={styles.combatLog}><small>LOG DE TESTE</small>{log.map((entry, index) => <p key={`${index}-${entry}`}>{entry}</p>)}</div>
        </aside>
      </div>
    </section>
  );
}
