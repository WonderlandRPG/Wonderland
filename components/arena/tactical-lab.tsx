"use client";

import { useMemo, useState } from "react";

import styles from "@/app/arena/mapa-tatico/tactical-lab.module.css";

type Position = { x: number; y: number };
type OverlayMode = "movement" | "range" | "none";

const WIDTH = 10;
const HEIGHT = 8;
const MOVE_LIMIT = 4;
const SKILL_RANGE = 3;

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

export function TacticalLab() {
  const [player, setPlayer] = useState<Position>(START_PLAYER);
  const [enemy] = useState<Position>(START_ENEMY);
  const [overlay, setOverlay] = useState<OverlayMode>("movement");
  const [message, setMessage] = useState("Selecione uma casa verde para mover o aventureiro.");

  const occupied = useMemo(() => new Set([keyOf(enemy)]), [enemy]);

  const reachable = useMemo(() => {
    const blocked = new Set([...obstacleKeys, ...occupied]);
    return getReachable(player, blocked, MOVE_LIMIT);
  }, [player, occupied]);

  const cells = useMemo(
    () =>
      Array.from({ length: WIDTH * HEIGHT }, (_, index) => ({
        x: index % WIDTH,
        y: Math.floor(index / WIDTH),
      })),
    [],
  );

  function handleCellClick(position: Position) {
    const cellKey = keyOf(position);

    if (cellKey === keyOf(player)) {
      setOverlay("movement");
      setMessage("Movimento selecionado. Casas verdes são posições válidas.");
      return;
    }

    if (overlay === "movement" && reachable.has(cellKey)) {
      setPlayer(position);
      setMessage(`Movimento validado: coluna ${position.x + 1}, linha ${position.y + 1}.`);
      return;
    }

    if (obstacleKeys.has(cellKey)) {
      setMessage("Movimento bloqueado: esta casa contém um obstáculo.");
      return;
    }

    if (cellKey === keyOf(enemy)) {
      setOverlay("range");
      setMessage(
        manhattan(player, enemy) <= SKILL_RANGE
          ? "O alvo está dentro do alcance de 3 casas."
          : "O alvo está fora do alcance de 3 casas.",
      );
      return;
    }

    setMessage("Casa inválida para a ação atual.");
  }

  function resetBoard() {
    setPlayer(START_PLAYER);
    setOverlay("movement");
    setMessage("Tabuleiro reiniciado.");
  }

  return (
    <section className={styles.lab} aria-label="Laboratório do mapa tático">
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Somente administradores · protótipo isolado</span>
          <h1>Laboratório do Mapa Tático</h1>
          <p>
            Esta área não altera Treino, PvE, PvP ou Dungeons. Aqui testamos primeiro as regras
            fundamentais do novo tabuleiro.
          </p>
        </div>
        <div className={styles.status} data-wl-status="success">
          <small>Estado do protótipo</small>
          <strong>Núcleo de movimentação ativo</strong>
        </div>
      </header>

      <div className={styles.toolbar} data-wl-surface="raised">
        <button
          type="button"
          data-wl-action={overlay === "movement" ? "primary" : undefined}
          onClick={() => {
            setOverlay("movement");
            setMessage("Movimento selecionado. Casas verdes são posições válidas.");
          }}
        >
          Movimento · {MOVE_LIMIT} casas
        </button>
        <button
          type="button"
          data-wl-action={overlay === "range" ? "primary" : undefined}
          onClick={() => {
            setOverlay("range");
            setMessage("Visualizando alcance de teste de 3 casas.");
          }}
        >
          Alcance · {SKILL_RANGE} casas
        </button>
        <button
          type="button"
          onClick={() => {
            setOverlay("none");
            setMessage("Sobreposições ocultas.");
          }}
        >
          Limpar marcações
        </button>
        <button type="button" onClick={resetBoard}>
          Reiniciar mapa
        </button>
      </div>

      <div className={styles.workspace}>
        <div className={styles.boardShell} data-wl-surface="dark">
          <div
            className={styles.board}
            style={{ gridTemplateColumns: `repeat(${WIDTH}, minmax(0, 1fr))` }}
          >
            {cells.map((position) => {
              const cellKey = keyOf(position);
              const isPlayer = cellKey === keyOf(player);
              const isEnemy = cellKey === keyOf(enemy);
              const isObstacle = obstacleKeys.has(cellKey);
              const isReachable = overlay === "movement" && reachable.has(cellKey);
              const isInRange =
                overlay === "range" &&
                !isPlayer &&
                !isObstacle &&
                manhattan(player, position) <= SKILL_RANGE;

              const state = isPlayer
                ? "player"
                : isEnemy
                  ? "enemy"
                  : isObstacle
                    ? "obstacle"
                    : isReachable
                      ? "reachable"
                      : isInRange
                        ? "range"
                        : "empty";

              return (
                <button
                  aria-label={
                    isPlayer
                      ? "Aventureiro"
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
            <span className={styles.eyebrow}>Teste atual</span>
            <h2>Regras já protegidas</h2>
          </div>
          <ul>
            <li>Movimento ortogonal por casas.</li>
            <li>Limite de 4 casas calculado por busca de caminho.</li>
            <li>Obstáculos interrompem o caminho.</li>
            <li>Uma unidade não pode ocupar a casa da outra.</li>
            <li>Alcance usa a posição lógica do tabuleiro.</li>
          </ul>

          <div className={styles.legend}>
            <span><i data-kind="player" />Aventureiro</span>
            <span><i data-kind="enemy" />Criatura</span>
            <span><i data-kind="movement" />Movimento válido</span>
            <span><i data-kind="range" />Alcance</span>
            <span><i data-kind="obstacle" />Obstáculo</span>
          </div>

          <p className={styles.message} role="status">{message}</p>
        </aside>
      </div>
    </section>
  );
}
