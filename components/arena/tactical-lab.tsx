"use client";

import { useMemo, useState } from "react";

import styles from "@/app/arena/mapa-tatico/tactical-lab.module.css";

type Position = { x: number; y: number };
type OverlayMode = "movement" | "range" | "none";

type TacticalSkill = {
  key: string;
  name: string;
  range: number;
  area: number;
  target: string;
  cost: number;
  resource: string;
  description: string;
};

type TacticalCharacter = {
  id: string;
  name: string;
  level: number;
  rank: string;
  raceName: string;
  className: string;
  maxHp: number;
  maxMana: number;
  attributes: Record<string, number>;
  basicAttackRange: number;
  skills: TacticalSkill[];
};

type SelectedAction =
  | { kind: "basic"; name: string; range: number; area: number }
  | { kind: "skill"; name: string; range: number; area: number; skill: TacticalSkill };

const WIDTH = 10;
const HEIGHT = 8;
const MOVE_LIMIT = 4;

const START_PLAYER: Position = { x: 2, y: 5 };
const START_ENEMY: Position = { x: 7, y: 2 };

const obstacleKeys = new Set([
  "4,1",
  "4,2",
  "4,3",
  "5,3",
  "6,3",
  "2,2",
  "7,5",
  "7,6",
]);

function keyOf(position: Position) {
  return `${position.x},${position.y}`;
}

function isInside(position: Position) {
  return position.x >= 0 && position.x < WIDTH && position.y >= 0 && position.y < HEIGHT;
}

function neighbors(position: Position): Position[] {
  return [
    { x: position.x + 1, y: position.y },
    { x: position.x - 1, y: position.y },
    { x: position.x, y: position.y + 1 },
    { x: position.x, y: position.y - 1 },
  ].filter(isInside);
}

function getReachable(start: Position, blocked: Set<string>, limit: number) {
  const distance = new Map<string, number>([[keyOf(start), 0]]);
  const queue: Position[] = [start];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;

    const currentDistance = distance.get(keyOf(current)) ?? 0;
    if (currentDistance >= limit) continue;

    for (const next of neighbors(current)) {
      const nextKey = keyOf(next);
      if (blocked.has(nextKey) || distance.has(nextKey)) continue;
      distance.set(nextKey, currentDistance + 1);
      queue.push(next);
    }
  }

  distance.delete(keyOf(start));
  return distance;
}

function manhattan(a: Position, b: Position) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function getAreaCells(center: Position, area: number) {
  if (area <= 0) return new Set<string>();
  const cells = new Set<string>();
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const position = { x, y };
      if (manhattan(center, position) <= area) cells.add(keyOf(position));
    }
  }
  return cells;
}

export function TacticalLab({ characters }: { characters: TacticalCharacter[] }) {
  const [selectedCharacterId, setSelectedCharacterId] = useState(characters[0]?.id ?? "");
  const [player, setPlayer] = useState<Position>(START_PLAYER);
  const [enemy] = useState<Position>(START_ENEMY);
  const [overlay, setOverlay] = useState<OverlayMode>("movement");
  const [remainingMove, setRemainingMove] = useState(MOVE_LIMIT);
  const [selectedAction, setSelectedAction] = useState<SelectedAction | null>(null);
  const [areaCenter, setAreaCenter] = useState<Position | null>(null);
  const [message, setMessage] = useState("Selecione uma casa verde para mover o aventureiro.");

  const character = characters.find((entry) => entry.id === selectedCharacterId) ?? characters[0];
  const occupied = useMemo(() => new Set([keyOf(enemy)]), [enemy]);

  const reachable = useMemo(() => {
    const blocked = new Set([...obstacleKeys, ...occupied]);
    return getReachable(player, blocked, remainingMove);
  }, [player, occupied, remainingMove]);

  const areaCells = useMemo(
    () => (areaCenter && selectedAction ? getAreaCells(areaCenter, selectedAction.area) : new Set<string>()),
    [areaCenter, selectedAction],
  );

  const cells = useMemo(
    () =>
      Array.from({ length: WIDTH * HEIGHT }, (_, index) => ({
        x: index % WIDTH,
        y: Math.floor(index / WIDTH),
      })),
    [],
  );

  function beginMovement() {
    setOverlay("movement");
    setSelectedAction(null);
    setAreaCenter(null);
    setMessage(
      remainingMove > 0
        ? `Movimento selecionado. Restam ${remainingMove} casa(s) neste turno.`
        : "Sem pontos de movimento. Encerre o turno para mover novamente.",
    );
  }

  function selectAction(action: SelectedAction) {
    setSelectedAction(action);
    setOverlay("range");
    setAreaCenter(null);
    setMessage(`${action.name} selecionado · alcance ${action.range} · área ${action.area}.`);
  }

  function handleCellClick(position: Position) {
    const cellKey = keyOf(position);

    if (overlay === "movement" && reachable.has(cellKey)) {
      const cost = reachable.get(cellKey) ?? 0;
      setPlayer(position);
      setRemainingMove((current) => Math.max(0, current - cost));
      setMessage(`Movimento validado: ${cost} ponto(s) de movimento consumido(s).`);
      return;
    }

    if (obstacleKeys.has(cellKey)) {
      setMessage("Ação bloqueada: esta casa contém um obstáculo.");
      return;
    }

    if (overlay === "range" && selectedAction) {
      const distance = manhattan(player, position);
      if (distance > selectedAction.range) {
        setMessage(`${selectedAction.name}: alvo fora do alcance (${distance}/${selectedAction.range}).`);
        setAreaCenter(null);
        return;
      }

      setAreaCenter(position);
      if (cellKey === keyOf(enemy)) {
        setMessage(`${selectedAction.name}: criatura de teste é um alvo válido a ${distance} casa(s).`);
      } else {
        setMessage(`${selectedAction.name}: casa válida a ${distance} casa(s) do personagem.`);
      }
      return;
    }

    if (cellKey === keyOf(player)) {
      beginMovement();
      return;
    }

    setMessage("Casa inválida para a ação atual.");
  }

  function endTurn() {
    setRemainingMove(MOVE_LIMIT);
    setOverlay("movement");
    setSelectedAction(null);
    setAreaCenter(null);
    setMessage(`Novo turno iniciado. ${MOVE_LIMIT} pontos de movimento restaurados.`);
  }

  function resetBoard() {
    setPlayer(START_PLAYER);
    setRemainingMove(MOVE_LIMIT);
    setOverlay("movement");
    setSelectedAction(null);
    setAreaCenter(null);
    setMessage("Tabuleiro reiniciado.");
  }

  function changeCharacter(id: string) {
    setSelectedCharacterId(id);
    resetBoard();
    const next = characters.find((entry) => entry.id === id);
    setMessage(next ? `${next.name} carregado no laboratório.` : "Personagem alterado.");
  }

  return (
    <section className={styles.lab} aria-label="Laboratório do mapa tático">
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Somente administradores · protótipo isolado</span>
          <h1>Laboratório do Mapa Tático</h1>
          <p>
            Esta área não altera Treino, PvE, PvP ou Dungeons. O tabuleiro usa dados reais da ficha,
            mas nenhuma ação daqui grava combate, recompensa ou progresso.
          </p>
        </div>
        <div className={styles.status} data-wl-status="success">
          <small>Estado do protótipo</small>
          <strong>Movimento + alcance real ativos</strong>
        </div>
      </header>

      {characters.length === 0 ? (
        <div className={styles.empty} data-wl-status="warning">
          Nenhum personagem foi encontrado nesta conta administrativa. Crie ou vincule uma ficha para
          testar habilidades reais no tabuleiro.
        </div>
      ) : null}

      {character ? (
        <>
          <section className={styles.characterPanel} data-wl-surface="raised">
            <label>
              <span>Personagem de teste</span>
              <select value={character.id} onChange={(event) => changeCharacter(event.target.value)}>
                {characters.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name} · Nv. {entry.level} · {entry.className}
                  </option>
                ))}
              </select>
            </label>
            <div className={styles.characterSummary}>
              <strong>{character.name}</strong>
              <span>{character.raceName} · {character.className} · Rank {character.rank}</span>
              <span>HP {character.maxHp.toLocaleString("pt-BR")} · Mana {character.maxMana.toLocaleString("pt-BR")}</span>
            </div>
            <div className={styles.attributes}>
              {Object.entries(character.attributes).map(([key, value]) => (
                <span key={key}><small>{key}</small><strong>{value}</strong></span>
              ))}
            </div>
          </section>

          <div className={styles.toolbar} data-wl-surface="raised">
            <button type="button" data-wl-action={overlay === "movement" ? "primary" : undefined} onClick={beginMovement}>
              Movimento · {remainingMove}/{MOVE_LIMIT}
            </button>
            <button
              type="button"
              data-wl-action={selectedAction?.kind === "basic" ? "primary" : undefined}
              onClick={() => selectAction({ kind: "basic", name: "Ataque básico", range: character.basicAttackRange, area: 0 })}
            >
              Ataque básico · alcance {character.basicAttackRange}
            </button>
            <button type="button" onClick={endTurn}>Encerrar turno</button>
            <button type="button" onClick={() => { setOverlay("none"); setAreaCenter(null); setMessage("Sobreposições ocultas."); }}>
              Limpar marcações
            </button>
            <button type="button" onClick={resetBoard}>Reiniciar mapa</button>
          </div>

          <div className={styles.skillBar} data-wl-surface="raised" aria-label="Habilidades reais do personagem">
            {character.skills.length ? character.skills.map((skill) => (
              <button
                key={skill.key}
                type="button"
                data-selected={selectedAction?.kind === "skill" && selectedAction.skill.key === skill.key ? "true" : "false"}
                onClick={() => selectAction({ kind: "skill", name: skill.name, range: skill.range, area: skill.area, skill })}
                title={skill.description}
              >
                <strong>{skill.name}</strong>
                <span>Alcance {skill.range} · Área {skill.area}</span>
                <small>{skill.cost > 0 ? `${skill.cost} ${skill.resource}` : "Sem custo"}</small>
              </button>
            )) : <p>Este personagem ainda não possui habilidades ativas desbloqueadas.</p>}
          </div>

          <div className={styles.workspace}>
            <div className={styles.boardShell} data-wl-surface="dark">
              <div className={styles.board} style={{ gridTemplateColumns: `repeat(${WIDTH}, minmax(0, 1fr))` }}>
                {cells.map((position) => {
                  const cellKey = keyOf(position);
                  const isPlayer = cellKey === keyOf(player);
                  const isEnemy = cellKey === keyOf(enemy);
                  const isObstacle = obstacleKeys.has(cellKey);
                  const isReachable = overlay === "movement" && reachable.has(cellKey);
                  const isInRange =
                    overlay === "range" &&
                    selectedAction &&
                    !isPlayer &&
                    !isObstacle &&
                    manhattan(player, position) <= selectedAction.range;
                  const isArea = areaCells.has(cellKey);

                  const state = isPlayer
                    ? "player"
                    : isEnemy
                      ? "enemy"
                      : isObstacle
                        ? "obstacle"
                        : isArea
                          ? "area"
                          : isReachable
                            ? "reachable"
                            : isInRange
                              ? "range"
                              : "empty";

                  return (
                    <button
                      aria-label={
                        isPlayer
                          ? character.name
                          : isEnemy
                            ? "Criatura de teste"
                            : isObstacle
                              ? "Obstáculo"
                              : `Casa ${position.x + 1}, ${position.y + 1}`
                      }
                      className={styles.cell}
                      data-state={state}
                      key={cellKey}
                      onClick={() => handleCellClick(position)}
                      type="button"
                    >
                      {isPlayer ? <span className={styles.unit}>♞</span> : null}
                      {isEnemy ? <span className={styles.unit}>♜</span> : null}
                      {isObstacle ? <span className={styles.obstacle}>◆</span> : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <aside className={styles.sidePanel} data-wl-surface="raised">
              <div>
                <span className={styles.eyebrow}>Validação espacial</span>
                <h2>Estado do turno</h2>
              </div>
              <ul>
                <li>Movimento restante: {remainingMove}/{MOVE_LIMIT}.</li>
                <li>Movimento usa caminho real e desconta a distância percorrida.</li>
                <li>Obstáculos e unidades bloqueiam ocupação.</li>
                <li>Ataque básico usa o alcance real da classe.</li>
                <li>Habilidades usam range/area originais cadastrados.</li>
              </ul>

              <div className={styles.legend}>
                <span><i data-kind="player" />Aventureiro</span>
                <span><i data-kind="enemy" />Criatura</span>
                <span><i data-kind="movement" />Movimento válido</span>
                <span><i data-kind="range" />Alcance</span>
                <span><i data-kind="area" />Área da habilidade</span>
                <span><i data-kind="obstacle" />Obstáculo</span>
              </div>

              {selectedAction ? (
                <div className={styles.actionDetails}>
                  <small>Ação selecionada</small>
                  <strong>{selectedAction.name}</strong>
                  <span>Alcance {selectedAction.range} · Área {selectedAction.area}</span>
                </div>
              ) : null}

              <p className={styles.message} role="status">{message}</p>
            </aside>
          </div>
        </>
      ) : null}
    </section>
  );
}
