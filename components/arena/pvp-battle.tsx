"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  expirePvpTurnAction,
  getPvpMatchStateAction,
  performPvpAction,
} from "@/app/arena/pvp-match-actions";
import { CharacterPortraitCard } from "@/components/characters/character-portrait-card";
import { CombatStatusDock } from "@/components/arena/combat-status-dock";
import { CombatResultModal } from "@/components/arena/combat-result-modal";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import type { ArenaCharacter, PvpRoomSnapshot } from "@/lib/game/arena-types";
import type { CombatantState } from "@/lib/game/combat";
import { createTurnActionUsage, isSilenced, isTurnBlocked } from "@/lib/game/turn-engine";
import { getReachableTacticalCells, tacticalPositionKey } from "@/lib/game/tactical-grid";
import { getTacticalMapById } from "@/lib/game/tactical-maps";
import styles from "./pvp-tactical-battle.module.css";

type Fx = { target: "own" | "enemy"; kind: "damage" | "heal" | "shield"; token: number } | null;

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
  const [pending, startTransition] = useTransition();
  const [clock, setClock] = useState(() => Date.now());
  const [fx, setFx] = useState<Fx>(null);
  const timeoutInFlight = useRef(false);
  const previous = useRef({
    ownHp: room.state.fighters[room.ownCharacterId]?.hp ?? 0,
    ownShield: room.state.fighters[room.ownCharacterId]?.shield ?? 0,
    enemyHp: room.state.fighters[room.opponentCharacterId]?.hp ?? 0,
    enemyShield: room.state.fighters[room.opponentCharacterId]?.shield ?? 0,
  });
  const state = room.state;
  const ownId = room.ownCharacterId;
  const enemyId = room.opponentCharacterId;
  const own = state.fighters[ownId];
  const enemy = state.fighters[enemyId];
  const usage = state.turnActions ?? createTurnActionUsage();
  const isMyTurn = state.status === "active" && state.activeCharacterId === ownId;
  const finished = state.status !== "active";
  const seconds = Math.max(0, Math.ceil((Date.parse(state.turnEndsAt) - clock) / 1000));
  const commandsBlocked = isTurnBlocked(own);
  const silenced = isSilenced(own);
  const map = getTacticalMapById(state.mapId ?? "ruinas-centrais");
  const ownPosition = state.positions?.[ownId] ?? map.playerStart;
  const enemyPosition = state.positions?.[enemyId] ?? map.enemyStart;
  const blockedCells = new Set([
    ...map.obstacles,
    ...(enemy.hp > 0 ? [tacticalPositionKey(enemyPosition)] : []),
  ]);
  const reachable =
    isMyTurn && !commandsBlocked
      ? getReachableTacticalCells({
          start: ownPosition,
          blocked: blockedCells,
          movement: state.movement ?? 4,
          grid: map.grid,
        })
      : new Map<string, number>();
  const cells = Array.from({ length: map.grid.width * map.grid.height }, (_, index) => ({
    x: index % map.grid.width,
    y: Math.floor(index / map.grid.width),
  }));

  const refresh = useCallback(async () => {
    const result = await getPvpMatchStateAction(matchId);
    if (result.ok) {
      setRoom((current) => (result.data.version > current.version ? result.data : current));
      if (
        result.data.state.status === "active" &&
        Date.parse(result.data.state.turnEndsAt) <= Date.now() &&
        !timeoutInFlight.current
      ) {
        timeoutInFlight.current = true;
        void expirePvpTurnAction(matchId)
          .then((advance) => {
            if (advance.ok)
              setRoom((current) =>
                advance.data.version > current.version ? advance.data : current,
              );
          })
          .finally(() => {
            timeoutInFlight.current = false;
          });
      }
    } else setError(result.message);
  }, [matchId]);

  useEffect(() => {
    const client = createBrowserSupabaseClient();
    const channel = client
      ?.channel(`pvp-match:${matchId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "v2_pvp_matches", filter: `id=eq.${matchId}` },
        () => void refresh(),
      )
      .subscribe();
    const fallback = window.setInterval(() => void refresh(), 2500);
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
    const old = previous.current;
    const next = {
      ownHp: own.hp,
      ownShield: own.shield,
      enemyHp: enemy.hp,
      enemyShield: enemy.shield,
    };
    if (next.ownHp < old.ownHp) setFx({ target: "own", kind: "damage", token: Date.now() });
    else if (next.ownHp > old.ownHp) setFx({ target: "own", kind: "heal", token: Date.now() });
    else if (next.ownShield > old.ownShield)
      setFx({ target: "own", kind: "shield", token: Date.now() });
    else if (next.enemyHp < old.enemyHp)
      setFx({ target: "enemy", kind: "damage", token: Date.now() });
    else if (next.enemyHp > old.enemyHp)
      setFx({ target: "enemy", kind: "heal", token: Date.now() });
    else if (next.enemyShield > old.enemyShield)
      setFx({ target: "enemy", kind: "shield", token: Date.now() });
    previous.current = next;
  }, [room.version, own.hp, own.shield, enemy.hp, enemy.shield]);

  useEffect(() => {
    if (seconds !== 0 || finished) return;
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [seconds, room.version, finished, refresh]);

  function submit(action: Record<string, unknown>) {
    if (pending || !isMyTurn || finished) return;
    setError("");
    startTransition(async () => {
      const result = await performPvpAction(matchId, room.version, action);
      if (result.data) setRoom(result.data);
      if (!result.ok) setError(result.message);
    });
  }

  return (
    <section className="arena-console pvp-realtime jrpg-battle">
      <header className="arena-toolbar arena-game-header">
        <div>
          <span className="eyebrow">PvP · combate por turnos</span>
          <h1>
            {character.name} contra {opponent.name}
          </h1>
          <p>1 Ataque Básico + 1 habilidade de Classe + 1 habilidade Racial por turno.</p>
        </div>
        <div className={`pvp-live-state ${isMyTurn ? "is-own" : ""}`}>
          <i />
          <small>
            {finished ? "Partida encerrada" : isMyTurn ? "Seu turno" : `Turno de ${enemy.name}`}
          </small>
          <strong>{pending ? "Sincronizando…" : "AO VIVO"}</strong>
        </div>
        <strong className={`arena-turn-timer ${seconds <= 10 ? "is-ending" : ""}`}>
          <small>Tempo</small>
          {String(seconds).padStart(2, "0")}s
        </strong>
        <strong className="arena-turn-counter">
          <small>Rodada</small>
          {String(state.round).padStart(2, "0")}
        </strong>
      </header>

      <div className="jrpg-turn-order" aria-label="Ordem dos turnos">
        {state.turnOrder.map((id, index) => (
          <span className={state.activeCharacterId === id ? "is-active" : ""} key={id}>
            {index + 1}. {state.fighters[id]?.name ?? "Combatente"}
          </span>
        ))}
      </div>

      {isMyTurn ? (
        <div className="turn-action-economy">
          <ActionSlot label="Ataque" used={usage.basic} />
          <ActionSlot label="Classe" used={usage.class} />
          <ActionSlot label="Raça" used={usage.race} />
        </div>
      ) : null}

      <div className={styles.battleLayout}>
        <Fighter
          fighter={own}
          character={character}
          active={state.activeCharacterId === ownId}
          label="VOCÊ"
          fx={fx?.target === "own" ? fx : null}
        />
        <div className={styles.boardWrap}>
          <div
            className={styles.board}
            style={{
              gridTemplateColumns: `repeat(${map.grid.width}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${map.grid.height}, minmax(0, 1fr))`,
              aspectRatio: `${map.grid.width} / ${map.grid.height}`,
            }}
            aria-label="Tabuleiro PvP tático"
          >
            {cells.map((position) => {
              const key = tacticalPositionKey(position);
              const isOwn = key === tacticalPositionKey(ownPosition);
              const isEnemy = key === tacticalPositionKey(enemyPosition);
              const obstacle = map.obstacles.includes(key);
              const canMove = reachable.has(key);
              return (
                <button
                  key={key}
                  type="button"
                  aria-label={
                    isOwn
                      ? character.name
                      : isEnemy
                        ? opponent.name
                        : obstacle
                          ? "Obstáculo"
                          : `Casa ${position.x + 1}, ${position.y + 1}`
                  }
                  data-state={
                    isOwn
                      ? "own"
                      : isEnemy
                        ? "enemy"
                        : obstacle
                          ? "obstacle"
                          : canMove
                            ? "reachable"
                            : undefined
                  }
                  disabled={obstacle || isOwn || isEnemy || !canMove || pending}
                  onClick={() => submit({ kind: "move", x: position.x, y: position.y })}
                >
                  {isOwn ? (
                    <span>♞</span>
                  ) : isEnemy ? (
                    <span>♜</span>
                  ) : obstacle ? (
                    <span>◆</span>
                  ) : canMove ? (
                    <i />
                  ) : null}
                </button>
              );
            })}
          </div>
          <small className={styles.boardHint}>
            Casas iluminadas podem ser alcançadas · movimento restante {state.movement ?? 4}
          </small>
        </div>
        <Fighter
          fighter={enemy}
          character={opponent}
          active={state.activeCharacterId === enemyId}
          label="OPONENTE"
          fx={fx?.target === "enemy" ? fx : null}
        />
      </div>

      <p className="arena-message" role="status">
        <span>Registro</span>
        {state.message}
      </p>
      {error ? <p className="arena-result__error pvp-sync-error">{error}</p> : null}

      {!finished ? (
        <section className={styles.actionDock} aria-label="Ações PvP do Rework">
          <IconAction
            name={character.basicAttackName ?? "Ataque básico"}
            detail={usage.basic ? "Usado" : `Alcance ${character.basicAttackRange}`}
            iconUrl={character.basicAttackIconUrl}
            disabled={!isMyTurn || pending || commandsBlocked || usage.basic}
            onClick={() => submit({ kind: "basic" })}
          />
          {character.skills.map((skill) => (
            <IconAction
              key={skill.key}
              name={skill.name}
              detail={usage.class ? "Classe usada" : `Classe · alcance ${skill.range}`}
              iconUrl={skill.iconUrl}
              disabled={!isMyTurn || pending || commandsBlocked || silenced || usage.class}
              onClick={() =>
                submit({
                  kind: "class",
                  key: skill.key,
                  targetId: skill.target === "self" ? ownId : enemyId,
                })
              }
            />
          ))}
          {character.raceAbilities.map((skill) => (
            <IconAction
              key={skill.key}
              name={skill.name}
              detail={usage.race ? "Racial usada" : `Raça · alcance ${skill.range}`}
              iconUrl={skill.iconUrl}
              disabled={!isMyTurn || pending || commandsBlocked || silenced || usage.race}
              onClick={() =>
                submit({
                  kind: "race",
                  key: skill.key,
                  targetId: skill.target === "self" ? ownId : enemyId,
                })
              }
            />
          ))}
          {character.items.map((item) => (
            <IconAction
              key={item.id}
              name={item.name}
              detail="Item · encerra turno"
              disabled={!isMyTurn || pending || commandsBlocked}
              onClick={() => submit({ kind: "item", id: item.id })}
            />
          ))}
          <IconAction
            name="Encerrar turno"
            detail="Passar a vez"
            disabled={!isMyTurn || pending || commandsBlocked}
            onClick={() => submit({ kind: "end" })}
          />
        </section>
      ) : (
        <CombatResultModal
          victory={state.winnerCharacterId === ownId}
          eyebrow="DUELO OFICIAL ENCERRADO"
          title={
            state.winnerCharacterId === ownId
              ? `${character.name} venceu!`
              : state.winnerCharacterId
                ? `${opponent.name} venceu.`
                : "O duelo terminou em derrota por desistência."
          }
          description={
            state.winnerCharacterId === ownId
              ? "Vitória registrada no histórico da Arena."
              : "A derrota foi registrada. Prepare-se para o próximo duelo."
          }
        >
          <Link className="button button--primary" href="/arena">
            Voltar à Arena
          </Link>
        </CombatResultModal>
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

function Fighter({
  fighter,
  character,
  active,
  label,
  fx,
}: {
  fighter: CombatantState;
  character: ArenaCharacter;
  active: boolean;
  label: string;
  fx: Fx;
}) {
  return (
    <article
      className={`pvp-fighter jrpg-fighter ${active ? "is-active" : ""} ${fx ? `fx-${fx.kind}` : ""}`}
    >
      <small>{label}</small>
      <div className="combat-identity-frame">
        <CharacterPortraitCard
          name={character.name}
          imageUrl={character.imageUrl || null}
          rank={character.adventureRank}
          level={character.level}
          title={character.equippedTitle}
          cosmetics={character.cosmetics}
          variant="compact"
          className="combat-official-character-card"
        />
        {fx ? (
          <span key={fx.token} className={`combat-fx combat-fx--${fx.kind}`}>
            {fx.kind === "heal" ? "+" : fx.kind === "shield" ? "✦" : "✹"}
          </span>
        ) : null}
      </div>
      <div className="combat-hud-panel">
        <h3>{fighter.name}</h3>
        <p>
          {character.raceName} · {character.className}
        </p>
        <Meter label="HP" value={fighter.hp} max={fighter.maxHp} kind="hp" />
        <div className="combat-resource-stack">
          {fighter.maxMana > 0 ? (
            <Meter label="Mana" value={fighter.mana} max={fighter.maxMana} kind="mana" />
          ) : null}
          {fighter.maxClassResource > 0 ? (
            <Meter
              label={fighter.classResourceName}
              value={fighter.classResource}
              max={fighter.maxClassResource}
              kind="class"
            />
          ) : null}
          {fighter.maxRaceResource > 0 ? (
            <Meter
              label={fighter.raceResourceName}
              value={fighter.raceResource}
              max={fighter.maxRaceResource}
              kind="race"
            />
          ) : null}
          {fighter.shield > 0 ? (
            <Meter
              label="Escudo"
              value={fighter.shield}
              max={Math.max(fighter.maxHp, fighter.shield)}
              kind="shield"
            />
          ) : null}
        </div>
        <CombatStatusDock fighter={fighter} />
      </div>
    </article>
  );
}

function Meter({
  label,
  value,
  max,
  kind,
}: {
  label: string;
  value: number;
  max: number;
  kind: "hp" | "mana" | "class" | "race" | "shield";
}) {
  return (
    <div className={`combat-meter combat-meter--${kind}`}>
      <span>
        <b>{label}</b>
        <strong>
          {value.toLocaleString("pt-BR")} / {max.toLocaleString("pt-BR")}
        </strong>
      </span>
      <progress max={Math.max(1, max)} value={Math.max(0, value)} />
    </div>
  );
}

function IconAction({
  name,
  detail,
  iconUrl,
  disabled,
  used = false,
  onClick,
}: {
  name: string;
  detail: string;
  iconUrl?: string;
  disabled: boolean;
  used?: boolean;
  onClick(): void;
}) {
  return (
    <button
      className={`${styles.actionButton} ${used ? styles.used : ""}`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {iconUrl ? (
        <Image src={iconUrl} alt="" width={58} height={58} />
      ) : (
        <span aria-hidden="true">◆</span>
      )}
      <strong>{name}</strong>
      <small>{detail}</small>
    </button>
  );
}
