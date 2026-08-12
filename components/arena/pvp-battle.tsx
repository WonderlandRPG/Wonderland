"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { getPvpMatchStateAction, performPvpAction } from "@/app/arena/pvp-match-actions";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { getEffectiveAttributes } from "@/lib/game/combat";
import { getMovementRange, tacticalGrid } from "@/lib/game/arena";
import type { ArenaCharacter, ArenaPosition, PvpRoomSnapshot } from "@/lib/game/arena-types";

export function PvpBattle({
  matchId,
  initialRoom,
  character,
  opponent,
}: {
  matchId: string;
  initialRoom: unknown;
  character: ArenaCharacter;
  opponent: ArenaCharacter;
}) {
  const [room, setRoom] = useState(initialRoom as PvpRoomSnapshot);
  const [error, setError] = useState("");
  const [moving, setMoving] = useState(false);
  const [pending, startTransition] = useTransition();
  const state = room.state;
  const ownId = room.ownCharacterId,
    enemyId = room.opponentCharacterId;
  const own = state.fighters[ownId],
    enemy = state.fighters[enemyId];
  const ownPosition = state.positions[ownId],
    enemyPosition = state.positions[enemyId];
  const isMyTurn = state.status === "active" && state.activeCharacterId === ownId;
  const [clock, setClock] = useState(() => Date.now());
  const seconds = Math.max(0, Math.ceil((Date.parse(state.turnEndsAt) - clock) / 1000));

  const refresh = useCallback(() => {
    startTransition(async () => {
      const result = await getPvpMatchStateAction(matchId);
      if (result.ok) setRoom(result.data);
      else setError(result.message);
    });
  }, [matchId]);

  useEffect(() => {
    const client = createBrowserSupabaseClient();
    const channel = client
      ?.channel(`pvp-match:${matchId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "v2_pvp_matches", filter: `id=eq.${matchId}` },
        refresh,
      )
      .subscribe();
    const fallback = window.setInterval(refresh, 2500);
    return () => {
      window.clearInterval(fallback);
      if (client && channel) void client.removeChannel(channel);
    };
  }, [matchId, refresh]);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (seconds !== 0 || !isMyTurn || pending) return;
    void submit({ kind: "end" });
    // O relógio só deve disparar uma vez por versão da sala.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds, isMyTurn, room.version]);

  async function submit(action: Record<string, unknown>) {
    if (pending) return;
    setError("");
    startTransition(async () => {
      const result = await performPvpAction(matchId, room.version, action);
      if (result.data) setRoom(result.data);
      if (!result.ok) setError(result.message);
      setMoving(false);
    });
  }

  const distance =
    Math.abs(ownPosition.x - enemyPosition.x) + Math.abs(ownPosition.y - enemyPosition.y);
  const movement = getMovementRange(getEffectiveAttributes(own).INI);
  const cells = useMemo(
    () =>
      Array.from({ length: tacticalGrid.width * tacticalGrid.height }, (_, index) => ({
        x: index % tacticalGrid.width,
        y: Math.floor(index / tacticalGrid.width),
      })),
    [],
  );
  const finished = state.status === "finished";

  return (
    <section className="arena-console pvp-realtime">
      <header className="arena-toolbar arena-game-header">
        <div>
          <span className="eyebrow">PvP sincronizado · sala oficial</span>
          <h1>
            {character.name} contra {opponent.name}
          </h1>
          <p>
            Uma única batalha compartilhada pelos dois jogadores. O servidor confirma todas as
            ações.
          </p>
        </div>
        <div className={`pvp-live-state ${isMyTurn ? "is-own" : ""}`}>
          <i />
          <small>
            {finished ? "Partida encerrada" : isMyTurn ? "Seu turno" : `Turno de ${enemy.name}`}
          </small>
          <strong>{pending ? "Sincronizando…" : "AO VIVO"}</strong>
        </div>
        <strong className={`arena-turn-timer ${seconds <= 10 ? "is-ending" : ""}`}>
          <small>Tempo do turno</small>
          {String(seconds).padStart(2, "0")}s
        </strong>
        <strong className="arena-turn-counter">
          <small>Rodada oficial</small>
          {String(state.turn).padStart(2, "0")}
        </strong>
      </header>
      <div className="pvp-fighters">
        <PvpFighter
          fighter={own}
          character={character}
          active={state.activeCharacterId === ownId}
          label="VOCÊ"
        />
        <span className="pvp-versus">
          VS<small>tempo real</small>
        </span>
        <PvpFighter
          fighter={enemy}
          character={opponent}
          active={state.activeCharacterId === enemyId}
          label="OPONENTE"
        />
      </div>
      <section className={`arena-map ${moving ? "is-moving" : ""}`}>
        <header>
          <span>Mapa compartilhado</span>
          <small>Distância oficial: {distance} casa(s)</small>
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
            const hasOwn = same(position, ownPosition),
              hasEnemy = same(position, enemyPosition);
            const reachable =
              moving &&
              isMyTurn &&
              !state.actions.move &&
              !hasOwn &&
              !hasEnemy &&
              gridDistance(ownPosition, position) <= movement;
            return (
              <button
                className={`${reachable ? "is-reachable" : ""} ${hasOwn ? "has-player" : ""} ${hasEnemy ? "has-enemy" : ""}`}
                disabled={!reachable}
                key={`${position.x}-${position.y}`}
                onClick={() => submit({ kind: "move", ...position })}
                type="button"
              >
                {hasOwn ? (
                  <span>{character.name.slice(0, 2).toUpperCase()}</span>
                ) : hasEnemy ? (
                  <span>{opponent.name.slice(0, 2).toUpperCase()}</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </section>
      <p className="arena-message" role="status">
        <span>Registro oficial</span>
        {state.message}
      </p>
      {error ? <p className="arena-result__error pvp-sync-error">{error}</p> : null}
      {!finished ? (
        <section className="arena-command-panel pvp-command-panel">
          <header>
            <div>
              <span className="eyebrow">Comandos do seu personagem</span>
              <h2>{isMyTurn ? "Escolha suas ações" : "Aguardando o adversário"}</h2>
            </div>
            <small>
              {isMyTurn
                ? "Cada ação é gravada e enviada ao outro jogador"
                : "A tela será atualizada automaticamente"}
            </small>
          </header>
          <div className="arena-turn-budget">
            <span className={state.actions.move ? "is-used" : ""}>
              Movimento {state.actions.move ? "✓" : "1"}
            </span>
            <span className={state.actions.basic ? "is-used" : ""}>
              Ataque {state.actions.basic ? "✓" : "1"}
            </span>
            <span className={state.actions.race ? "is-used" : ""}>
              Raça {state.actions.race ? "✓" : "1"}
            </span>
            <span className={state.actions.class ? "is-used" : ""}>
              Classe {state.actions.class ? "✓" : "1"}
            </span>
            <span className={state.actions.item ? "is-used" : ""}>
              Item {state.actions.item ? "✓" : "1"}
            </span>
          </div>
          <div className="pvp-actions-grid">
            <ActionButton
              disabled={!isMyTurn || pending || state.actions.move || state.actions.defend}
              origin="MOVIMENTO"
              name={moving ? `Escolha uma casa até ${movement}` : "Mover"}
              detail={`Até ${movement} casas`}
              onClick={() => setMoving((value) => !value)}
            />
            <ActionButton
              disabled={!isMyTurn || pending || state.actions.basic || state.actions.defend}
              origin="ATAQUE BÁSICO"
              name="Atacar"
              detail={`Alcance ${character.basicAttackRange} · distância ${distance}`}
              onClick={() => submit({ kind: "basic" })}
            />
            <ActionButton
              disabled={
                !isMyTurn ||
                pending ||
                Object.values(state.actions).some(Boolean) ||
                (own.cooldowns["defesa-total"] ?? 0) > 0
              }
              origin="DEFESA"
              name="Defender"
              detail="Bloqueia o próximo dano"
              onClick={() => submit({ kind: "defend" })}
            />
            {character.raceAbilities.map((skill) => (
              <ActionButton
                key={skill.key}
                disabled={
                  !isMyTurn ||
                  pending ||
                  state.actions.race ||
                  state.actions.defend ||
                  (own.cooldowns[skill.key] ?? 0) > 0
                }
                origin="HABILIDADE DE RAÇA"
                name={skill.name}
                detail={`${skill.cost} ${own.raceResourceName} · alcance ${skill.range}`}
                onClick={() => submit({ kind: "race", key: skill.key })}
              />
            ))}
            {character.skills.map((skill) => (
              <ActionButton
                key={skill.key}
                disabled={
                  !isMyTurn ||
                  pending ||
                  state.actions.class ||
                  state.actions.defend ||
                  (own.cooldowns[skill.key] ?? 0) > 0
                }
                origin="HABILIDADE DE CLASSE"
                name={skill.name}
                detail={`${skill.cost} ${own.classResourceName} · alcance ${skill.range}`}
                onClick={() => submit({ kind: "class", key: skill.key })}
              />
            ))}
            {character.items.map((item) => (
              <ActionButton
                key={item.id}
                disabled={!isMyTurn || pending || state.actions.item || state.actions.defend}
                origin="ITEM"
                name={item.name}
                detail={item.description}
                onClick={() => submit({ kind: "item", id: item.id })}
              />
            ))}
          </div>
          <button
            className="button button--primary pvp-end-turn"
            disabled={!isMyTurn || pending}
            onClick={() => submit({ kind: "end" })}
            type="button"
          >
            Confirmar e encerrar turno
          </button>
        </section>
      ) : (
        <section
          className={`arena-result ${state.winnerCharacterId === ownId ? "is-victory" : "is-defeat"}`}
        >
          <span>{state.winnerCharacterId === ownId ? "VITÓRIA" : "DERROTA"}</span>
          <h2>{state.fighters[state.winnerCharacterId ?? enemyId].name} venceu o duelo</h2>
          <p>Este resultado é o mesmo para os dois jogadores e foi confirmado pela sala oficial.</p>
          <a className="button button--primary" href="/arena?modo=pvp">
            Voltar à fila PvP
          </a>
        </section>
      )}
    </section>
  );
}

function same(a: ArenaPosition, b: ArenaPosition) {
  return a.x === b.x && a.y === b.y;
}
function gridDistance(a: ArenaPosition, b: ArenaPosition) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}
function ActionButton({
  disabled,
  origin,
  name,
  detail,
  onClick,
}: {
  disabled: boolean;
  origin: string;
  name: string;
  detail: string;
  onClick(): void;
}) {
  return (
    <button disabled={disabled} onClick={onClick} type="button">
      <small>{origin}</small>
      <strong>{name}</strong>
      <span>{detail}</span>
    </button>
  );
}
function PvpFighter({
  fighter,
  character,
  active,
  label,
}: {
  fighter: PvpRoomSnapshot["state"]["fighters"][string];
  character: ArenaCharacter;
  active: boolean;
  label: string;
}) {
  return (
    <article className={`pvp-fighter-card ${active ? "is-active" : ""}`}>
      <div
        className="pvp-fighter-card__image"
        style={character.imageUrl ? { backgroundImage: `url(${character.imageUrl})` } : undefined}
      >
        <span>{label}</span>
        {character.imageUrl ? null : character.name.slice(0, 2).toUpperCase()}
      </div>
      <div>
        <span className="eyebrow">
          {character.raceName} · {character.className}
        </span>
        <h2>{fighter.name}</h2>
        <Resource label="HP" value={fighter.hp} max={fighter.maxHp} kind="hp" />
        {fighter.maxClassResource > 0 ? (
          <Resource
            label={fighter.classResourceName}
            value={fighter.classResource}
            max={fighter.maxClassResource}
            kind="class"
          />
        ) : null}
        {fighter.maxRaceResource > 0 ? (
          <Resource
            label={fighter.raceResourceName}
            value={fighter.raceResource}
            max={fighter.maxRaceResource}
            kind="race"
          />
        ) : null}
        {fighter.shield > 0 ? <small>Escudo ativo: {fighter.shield}</small> : null}
      </div>
    </article>
  );
}
function Resource({
  label,
  value,
  max,
  kind,
}: {
  label: string;
  value: number;
  max: number;
  kind: string;
}) {
  return (
    <div className="pvp-resource">
      <span>
        {label}
        <strong>
          {value}/{max}
        </strong>
      </span>
      <progress className={`is-${kind}`} max={max} value={value} />
    </div>
  );
}
