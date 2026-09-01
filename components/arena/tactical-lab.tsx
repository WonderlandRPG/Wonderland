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
import { resolveJrpgAreaSkill, resolveJrpgSkill } from "@/lib/game/jrpg-skill";
import {
  getForcedMovementDestination,
  getReachableTacticalCells,
  getTacticalAreaCells,
  getTacticalDistance,
  hasTacticalLineOfSight,
  tacticalPositionKey,
  type TacticalPosition,
} from "@/lib/game/tactical-grid";

type OverlayMode = "movement" | "range" | "none";
type SkillSource = "class" | "race";

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
};

type SelectedAction =
  | { kind: "basic"; name: string; range: number; area: 0 }
  | { kind: "skill"; name: string; range: number; area: number; source: SkillSource; skill: ClassSkill };

const GRID = { width: 10, height: 8 } as const;
const MOVE_LIMIT = 4;
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
  if (maximum <= 0) return 0;
  return Math.max(0, Math.min(100, (current / maximum) * 100));
}

function hasSpatialSelfMovement(skill: ClassSkill) {
  return skill.operations.some(
    (operation) =>
      (operation.operation === "MOVE" || operation.operation === "TELEPORT") &&
      (operation.target === "self" || operation.target === "source"),
  );
}

function rootTurns(combatant: CombatantState) {
  return Object.entries(combatant.statuses).reduce((maximum, [key, status]) => {
    const text = `${key} ${status.name}`.toLowerCase();
    return /root|enraiz|imobil/.test(text) ? Math.max(maximum, status.duration) : maximum;
  }, 0);
}

export function TacticalLab({ characters }: { characters: TacticalCharacter[] }) {
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
  const [usedSkill, setUsedSkill] = useState(false);
  const [message, setMessage] = useState("Selecione uma casa verde para mover o aventureiro.");
  const [log, setLog] = useState<string[]>(["Laboratório iniciado. Nenhum progresso real será salvo."]);

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

  const activePlayer: CombatantState = playerCombat;
  const activeEnemy: CombatantState = enemyCombat;
  const defeated = activeEnemy.hp <= 0;
  const playerRooted = rootTurns(activePlayer);
  const enemyRooted = rootTurns(activeEnemy);

  function pushLog(text: string) {
    setLog((current) => [text, ...current].slice(0, 8));
  }

  function clearSelection() {
    setSelectedAction(null);
    setAreaCenter(null);
  }

  function beginMovement() {
    if (defeated) return setMessage("Reinicie o mapa para continuar os testes.");
    if (playerRooted > 0) return setMessage(`${activePlayer.name} está imobilizado por ${playerRooted} turno(s).`);
    clearSelection();
    setOverlay("movement");
    setMessage(remainingMove > 0 ? `Restam ${remainingMove} ponto(s) de movimento.` : "Sem movimento restante neste turno.");
  }

  function selectAction(action: SelectedAction) {
    if (defeated) return setMessage("A Sentinela Rúnica já foi derrotada. Reinicie o mapa.");
    if (action.kind === "basic" && usedBasic) return setMessage("O ataque básico já foi usado neste turno.");
    if (action.kind === "skill") {
      if (usedSkill) return setMessage("Uma habilidade já foi usada neste turno.");
      const cooldown = activePlayer.cooldowns[action.skill.key] ?? 0;
      if (cooldown > 0) return setMessage(`${action.skill.name} está em cooldown por ${cooldown} turno(s).`);
    }
    setSelectedAction(action);
    setAreaCenter(null);
    setOverlay("range");
    setMessage(`${action.name} selecionado. Clique em um alvo/casa válida.`);
  }

  function applyBasicAttack() {
    if (usedBasic) return setMessage("O ataque básico já foi usado neste turno.");
    const result = resolveBasicAttack(activePlayer, activeEnemy);
    setPlayerCombat(result.actor);
    setEnemyCombat(result.target);
    setUsedBasic(true);
    setMessage(result.event.message);
    pushLog(result.event.message);
    if (result.target.hp <= 0) pushLog("Sentinela Rúnica derrotada no laboratório.");
  }

  function applySpatialOperations(skill: ClassSkill, center: TacticalPosition) {
    const notes: string[] = [];
    for (const operation of skill.operations) {
      const distance = Math.max(1, operation.distance || skill.range || 1);
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
        if (!obstacleKeys.has(tacticalPositionKey(center)) && tacticalPositionKey(center) !== tacticalPositionKey(enemyPosition)) {
          setPlayerPosition(center);
          notes.push(`${operation.operation === "TELEPORT" ? "Teleporte" : "Movimento especial"}: ${center.x + 1},${center.y + 1}.`);
        }
      }
    }
    notes.forEach(pushLog);
    return notes;
  }

  function applySkill(action: Extract<SelectedAction, { kind: "skill" }>, center: TacticalPosition) {
    if (usedSkill) return setMessage("Uma habilidade já foi usada neste turno.");
    const spatialSelf = hasSpatialSelfMovement(action.skill);
    const selfTarget = !spatialSelf && (action.skill.target === "self" || action.skill.target === "ally");
    let result;

    if (selfTarget || spatialSelf) {
      result = resolveJrpgSkill(activePlayer, activePlayer, action.skill);
      if (result.event.kind === "error") return setMessage(result.event.message);
      setPlayerCombat(result.target.id === activePlayer.id ? result.target : result.actor);
    } else if (action.area > 0) {
      const affected = getTacticalAreaCells({ center, radius: action.area, grid: GRID });
      if (!affected.has(tacticalPositionKey(enemyPosition))) {
        setMessage(`${action.name}: a área selecionada não atingiu a Sentinela Rúnica.`);
        return;
      }
      const areaResult = resolveJrpgAreaSkill(activePlayer, [activeEnemy], action.skill);
      const target = areaResult.targets[0];
      const event = areaResult.events[0];
      if (!target || !event) return;
      if (event.kind === "error") return setMessage(event.message);
      setPlayerCombat(areaResult.actor);
      setEnemyCombat(target);
      result = { actor: areaResult.actor, target, event };
    } else {
      result = resolveJrpgSkill(activePlayer, activeEnemy, action.skill);
      if (result.event.kind === "error") return setMessage(result.event.message);
      setPlayerCombat(result.actor);
      setEnemyCombat(result.target);
    }

    const spatialNotes = applySpatialOperations(action.skill, center);
    setUsedSkill(true);
    const text = `${result.event.message}${spatialNotes.length ? ` ${spatialNotes.join(" ")}` : ""}`;
    setMessage(text);
    pushLog(result.event.message);
    if (!selfTarget && !spatialSelf && result.target.hp <= 0) pushLog("Sentinela Rúnica derrotada no laboratório.");
  }

  function handleCellClick(position: TacticalPosition) {
    const cellKey = tacticalPositionKey(position);

    if (overlay === "movement" && reachable.has(cellKey)) {
      if (playerRooted > 0) return setMessage(`${activePlayer.name} está imobilizado e não pode se mover.`);
      const cost = reachable.get(cellKey) ?? 0;
      setPlayerPosition(position);
      setRemainingMove((current) => Math.max(0, current - cost));
      setMessage(`Movimento validado: ${cost} ponto(s) consumido(s).`);
      return;
    }

    if (obstacleKeys.has(cellKey)) return setMessage("Ação bloqueada: existe um obstáculo nessa casa.");

    if (overlay === "range" && selectedAction) {
      const spatialSelf = selectedAction.kind === "skill" && hasSpatialSelfMovement(selectedAction.skill);
      const selfTarget = selectedAction.kind === "skill" && !spatialSelf && (selectedAction.skill.target === "self" || selectedAction.skill.target === "ally");
      if (selfTarget) {
        if (cellKey !== tacticalPositionKey(playerPosition)) return setMessage("Essa habilidade deve ser usada no próprio personagem.");
        setAreaCenter(playerPosition);
        applySkill(selectedAction, playerPosition);
        return;
      }

      const distance = getTacticalDistance(playerPosition, position);
      if (distance > selectedAction.range) {
        setAreaCenter(null);
        return setMessage(`${selectedAction.name}: fora do alcance (${distance}/${selectedAction.range}).`);
      }

      if (!spatialSelf && !hasTacticalLineOfSight({ from: playerPosition, to: position, blocked: obstacleKeys })) {
        setAreaCenter(null);
        return setMessage(`${selectedAction.name}: linha de visão bloqueada por um obstáculo.`);
      }

      setAreaCenter(position);
      if (selectedAction.kind === "basic") {
        if (cellKey !== tacticalPositionKey(enemyPosition)) return setMessage("Ataque básico precisa selecionar a criatura.");
        applyBasicAttack();
        return;
      }

      if (spatialSelf) {
        if (cellKey === tacticalPositionKey(enemyPosition)) return setMessage("O destino está ocupado pela Sentinela.");
        applySkill(selectedAction, position);
        return;
      }

      if (selectedAction.area > 0) {
        applySkill(selectedAction, position);
        return;
      }

      if (cellKey !== tacticalPositionKey(enemyPosition)) return setMessage("Selecione a Sentinela Rúnica como alvo.");
      applySkill(selectedAction, position);
      return;
    }

    if (cellKey === tacticalPositionKey(playerPosition)) beginMovement();
  }

  function endTurn() {
    setPlayerCombat(tickCooldowns(activePlayer));
    setEnemyCombat(tickCooldowns(activeEnemy));
    setRemainingMove(MOVE_LIMIT);
    setUsedBasic(false);
    setUsedSkill(false);
    clearSelection();
    setOverlay("movement");
    setMessage(`Novo turno de teste iniciado. ${MOVE_LIMIT} pontos de movimento restaurados.`);
    pushLog("Turno encerrado: cooldowns e status avançaram.");
  }

  function resetBoard(nextCharacter = character) {
    setPlayerPosition(START_PLAYER);
    setEnemyPosition(START_ENEMY);
    setRemainingMove(MOVE_LIMIT);
    setUsedBasic(false);
    setUsedSkill(false);
    setPlayerCombat(makePlayer(nextCharacter));
    setEnemyCombat(makeEnemy(nextCharacter));
    clearSelection();
    setOverlay("movement");
    setMessage("Tabuleiro e estados de combate reiniciados.");
    setLog(["Laboratório reiniciado."]);
  }

  function changeCharacter(id: string) {
    const next = characters.find((entry) => entry.id === id);
    if (!next) return;
    setSelectedCharacterId(id);
    resetBoard(next);
    setMessage(`${next.name} carregado no laboratório.`);
  }

  return (
    <section className={styles.lab} aria-label="Laboratório do mapa tático">
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Somente administradores · protótipo isolado</span>
          <h1>Laboratório do Mapa Tático</h1>
          <p>Combate real em memória: dano, recursos, cooldown e efeitos espaciais funcionam aqui sem salvar recompensa, progresso ou sessão.</p>
        </div>
        <div className={styles.status}><small>Estado do protótipo</small><strong>Combate + espaço ativos</strong></div>
      </header>

      <section className={styles.characterPanel} data-wl-surface="raised">
        <label>
          <span>Personagem de teste</span>
          <select value={character.id} onChange={(event) => changeCharacter(event.target.value)}>
            {characters.map((entry) => <option key={entry.id} value={entry.id}>{entry.name} · Nv. {entry.level} · {entry.className}</option>)}
          </select>
        </label>
        <div className={styles.characterSummary}>
          <strong>{character.name}</strong>
          <span>{character.raceName} · {character.className} · Rank {character.rank}</span>
          <span>HP {activePlayer.hp}/{activePlayer.maxHp} · Mana {activePlayer.mana}/{activePlayer.maxMana}</span>
        </div>
        <div className={styles.attributes}>
          {Object.entries(character.attributes).map(([key, value]) => <span key={key}><small>{key}</small><strong>{value}</strong></span>)}
        </div>
      </section>

      <section className={styles.combatHud}>
        <article>
          <small>AVENTUREIRO</small><strong>{activePlayer.name}</strong>
          <div className={styles.bar}><i style={{ width: `${percent(activePlayer.hp, activePlayer.maxHp)}%` }} /></div>
          <span>HP {activePlayer.hp} / {activePlayer.maxHp}</span>
          {activePlayer.maxMana > 0 ? <span>Mana {activePlayer.mana} / {activePlayer.maxMana}</span> : null}
          {activePlayer.maxClassResource > 0 ? <span>{activePlayer.classResourceName}: {activePlayer.classResource}/{activePlayer.maxClassResource}</span> : null}
          {activePlayer.maxRaceResource > 0 ? <span>{activePlayer.raceResourceName}: {activePlayer.raceResource}/{activePlayer.maxRaceResource}</span> : null}
          {playerRooted > 0 ? <span>Imobilizado: {playerRooted} turno(s)</span> : null}
        </article>
        <article data-enemy="true">
          <small>ALVO DE TESTE</small><strong>Sentinela Rúnica</strong>
          <div className={styles.bar}><i style={{ width: `${percent(activeEnemy.hp, activeEnemy.maxHp)}%` }} /></div>
          <span>HP {activeEnemy.hp} / {activeEnemy.maxHp}</span>
          <span>{defeated ? "DERROTADA" : enemyRooted > 0 ? `Imobilizada: ${enemyRooted}` : "Ativa"}</span>
        </article>
      </section>

      <div className={styles.toolbar} data-wl-surface="raised">
        <button type="button" disabled={playerRooted > 0} data-wl-action={overlay === "movement" ? "primary" : undefined} onClick={beginMovement}>Movimento · {remainingMove}/{MOVE_LIMIT}</button>
        <button type="button" disabled={usedBasic || defeated} data-wl-action={selectedAction?.kind === "basic" ? "primary" : undefined} onClick={() => selectAction({ kind: "basic", name: "Ataque básico", range: character.basicAttackRange, area: 0 })}>Ataque básico · alcance {character.basicAttackRange}</button>
        <button type="button" onClick={endTurn}>Encerrar turno</button>
        <button type="button" onClick={() => { setOverlay("none"); clearSelection(); }}>Limpar marcações</button>
        <button type="button" onClick={() => resetBoard()}>Reiniciar mapa</button>
      </div>

      <div className={styles.skillBar} data-wl-surface="raised" aria-label="Habilidades reais do personagem">
        {character.skills.map(({ source, skill }) => {
          const cooldown = activePlayer.cooldowns[skill.key] ?? 0;
          const spatial = skill.operations.filter((operation) => ["ROOT", "PUSH", "MOVE", "TELEPORT"].includes(operation.operation));
          return (
            <button key={`${source}-${skill.key}`} type="button" disabled={usedSkill || cooldown > 0 || defeated} data-selected={selectedAction?.kind === "skill" && selectedAction.skill.key === skill.key ? "true" : "false"} onClick={() => selectAction({ kind: "skill", name: skill.name, range: skill.range, area: skill.area, source, skill })} title={skill.playerDescription}>
              <strong>{skill.name}</strong>
              <span>{source === "class" ? "Classe" : "Raça"} · Alcance {skill.range} · Área {skill.area}</span>
              <small>{cooldown > 0 ? `Cooldown: ${cooldown}` : skill.cost > 0 ? `${skill.cost} ${skill.resource}` : "Sem custo"}</small>
              {spatial.length ? <small>Espacial: {spatial.map((operation) => operation.operation).join(" + ")}</small> : null}
            </button>
          );
        })}
      </div>

      <div className={styles.workspace}>
        <div className={styles.boardShell} data-wl-surface="dark">
          <div className={styles.board} style={{ gridTemplateColumns: `repeat(${GRID.width}, minmax(0, 1fr))` }}>
            {cells.map((position) => {
              const cellKey = tacticalPositionKey(position);
              const isPlayer = cellKey === tacticalPositionKey(playerPosition);
              const isEnemy = cellKey === tacticalPositionKey(enemyPosition);
              const isObstacle = obstacleKeys.has(cellKey);
              const isReachable = overlay === "movement" && reachable.has(cellKey);
              const spatialSelf = selectedAction?.kind === "skill" && hasSpatialSelfMovement(selectedAction.skill);
              const selfTarget = selectedAction?.kind === "skill" && !spatialSelf && (selectedAction.skill.target === "self" || selectedAction.skill.target === "ally");
              const isInRange = overlay === "range" && selectedAction && !isObstacle && (selfTarget ? isPlayer : getTacticalDistance(playerPosition, position) <= selectedAction.range);
              const isArea = areaCells.has(cellKey);
              const state = isPlayer ? "player" : isEnemy ? "enemy" : isObstacle ? "obstacle" : isArea ? "area" : isReachable ? "reachable" : isInRange ? "range" : "empty";
              return (
                <button key={cellKey} type="button" className={styles.cell} data-state={state} onClick={() => handleCellClick(position)} aria-label={isPlayer ? character.name : isEnemy ? "Sentinela Rúnica" : isObstacle ? "Obstáculo" : `Casa ${position.x + 1}, ${position.y + 1}`}>
                  {isPlayer ? <span className={styles.unit}>♞</span> : null}
                  {isEnemy ? <span className={styles.unit}>♜</span> : null}
                  {isObstacle ? <span className={styles.obstacle}>◆</span> : null}
                </button>
              );
            })}
          </div>
        </div>

        <aside className={styles.sidePanel} data-wl-surface="raised">
          <div><span className={styles.eyebrow}>Combate tático</span><h2>Estado do turno</h2></div>
          <ul>
            <li>Movimento: {remainingMove}/{MOVE_LIMIT}.</li>
            <li>Ataque básico: {usedBasic ? "usado" : "disponível"}.</li>
            <li>Habilidade: {usedSkill ? "usada" : "disponível"}.</li>
            <li>Linha de visão é bloqueada pelos obstáculos.</li>
            <li>Push, Move, Teleport e Root usam as casas reais do mapa.</li>
          </ul>
          {selectedAction ? <div className={styles.actionDetails}><small>Ação selecionada</small><strong>{selectedAction.name}</strong><span>Alcance {selectedAction.range} · Área {selectedAction.area}</span></div> : null}
          <p className={styles.message} role="status">{message}</p>
          <div className={styles.combatLog}><small>LOG DE TESTE</small>{log.map((entry, index) => <p key={`${index}-${entry}`}>{entry}</p>)}</div>
        </aside>
      </div>
    </section>
  );
}
