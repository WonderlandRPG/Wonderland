"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  expirePvpDuoTurnAction,
  getPvpDuoMatchStateAction,
  performPvpDuoAction,
} from "@/app/arena/pvp-duo/[matchId]/actions";
import { CombatResultModal } from "@/components/arena/combat-result-modal";
import { CombatFeedbackLayer } from "@/components/arena/combat-feedback-layer";
import { CombatStatusDock } from "@/components/arena/combat-status-dock";
import { CharacterPortraitCard } from "@/components/characters/character-portrait-card";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import type { ArenaCharacter } from "@/lib/game/arena-types";
import type { CombatantState } from "@/lib/game/combat";
import type { PvpDuoBattleState } from "@/lib/game/pvp-duo-state";
import { createTurnActionUsage, isSilenced, isTurnBlocked } from "@/lib/game/turn-engine";
import { getReachableTacticalCells, tacticalPositionKey } from "@/lib/game/tactical-grid";
import { getTacticalMapById } from "@/lib/game/tactical-maps";
import styles from "./pvp-tactical-battle.module.css";

type TeamRoom = {
  matchId: string;
  version: number;
  format: "duo" | "trio";
  ownCharacterId: string;
  opponentCharacterId: string;
  ownCharacterIds: string[];
  opponentCharacterIds: string[];
  controllableCharacterIds: string[];
  state: PvpDuoBattleState;
};
type Member = { team: number; slot: number; character: ArenaCharacter };

export function PvpDuoBattle({
  matchId,
  initialRoom,
  members,
  ownTeam,
}: {
  matchId: string;
  initialRoom: TeamRoom;
  members: Member[];
  ownTeam: number;
}) {
  const [room, setRoom] = useState(initialRoom);
  const [targetId, setTargetId] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [clock, setClock] = useState(() => Date.now());
  const [realtimeReady, setRealtimeReady] = useState(false);
  const timeoutInFlight = useRef(false);
  const state = room.state;
  const meta = useMemo(
    () => Object.fromEntries(members.map((entry) => [entry.character.id, entry.character])),
    [members],
  );
  const activeId = state.activeCharacterId;
  const activeCharacter = meta[activeId];
  const activeFighter = state.fighters[activeId];
  const usage = state.turnActions ?? createTurnActionUsage();
  const isMyTurn = state.status === "active" && room.controllableCharacterIds.includes(activeId);
  const blocked = activeFighter ? isTurnBlocked(activeFighter) : false;
  const silenced = activeFighter ? isSilenced(activeFighter) : false;
  const finished = state.status !== "active";
  const seconds = Math.max(0, Math.ceil((Date.parse(state.turnEndsAt) - clock) / 1000));
  const ownIds = room.ownCharacterIds.filter(Boolean);
  const enemyIds = room.opponentCharacterIds.filter(Boolean);
  const livingTargets = [...ownIds, ...enemyIds].filter((id) => (state.fighters[id]?.hp ?? 0) > 0);
  const selectedTarget =
    targetId && livingTargets.includes(targetId)
      ? targetId
      : (enemyIds.find((id) => (state.fighters[id]?.hp ?? 0) > 0) ?? activeId);
  const map = getTacticalMapById(state.mapId ?? "ruinas-centrais");
  const activePosition = state.positions?.[activeId];
  const occupied = new Set(
    Object.entries(state.positions ?? {})
      .filter(([id]) => id !== activeId && (state.fighters[id]?.hp ?? 0) > 0)
      .map(([, position]) => tacticalPositionKey(position)),
  );
  const reachable =
    isMyTurn && !blocked && activePosition
      ? getReachableTacticalCells({
          start: activePosition,
          blocked: new Set([...map.obstacles, ...occupied]),
          movement: state.movement ?? 4,
          grid: map.grid,
        })
      : new Map<string, number>();
  const cells = Array.from({ length: map.grid.width * map.grid.height }, (_, index) => ({
    x: index % map.grid.width,
    y: Math.floor(index / map.grid.width),
  }));
  const abilityIconUrls = useMemo(
    () =>
      members.flatMap(({ character }) => [
        character.basicAttackIconUrl,
        ...character.skills.map((skill) => skill.iconUrl),
        ...character.raceAbilities.map((skill) => skill.iconUrl),
      ]),
    [members],
  );

  const refresh = useCallback(async () => {
    const result = await getPvpDuoMatchStateAction(matchId);
    if (!result.ok) return setError(result.message);
    setRoom((current) => (result.data.version > current.version ? result.data : current));
    if (
      result.data.state.status === "active" &&
      Date.parse(result.data.state.turnEndsAt) <= Date.now() &&
      !timeoutInFlight.current
    ) {
      timeoutInFlight.current = true;
      void expirePvpDuoTurnAction(matchId)
        .then((next) => {
          if (next.ok)
            setRoom((current) => (next.data.version > current.version ? next.data : current));
        })
        .finally(() => {
          timeoutInFlight.current = false;
        });
    }
  }, [matchId]);

  useEffect(() => {
    const client = createBrowserSupabaseClient();
    const channel = client
      ?.channel(`pvp-team:${matchId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "v2_pvp_matches", filter: `id=eq.${matchId}` },
        () => void refresh(),
      )
      .subscribe((status) => setRealtimeReady(status === "SUBSCRIBED"));
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 1200);
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      if (client && channel) void client.removeChannel(channel);
    };
  }, [matchId, refresh]);
  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    if (seconds !== 0 || finished) return;
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [seconds, finished, refresh]);

  function submit(action: Record<string, unknown>) {
    if (!isMyTurn || pending || finished) return;
    setError("");
    startTransition(async () => {
      const result = await performPvpDuoAction(matchId, room.version, action);
      if (result.data) setRoom(result.data);
      if (!result.ok) setError(result.message);
    });
  }

  const winnerTeam = state.winnerCharacterId
    ? members.find((entry) => entry.character.id === state.winnerCharacterId)?.team
    : null;
  return (
    <section className="arena-console jrpg-battle pvp-duo-battle">
      <CombatFeedbackLayer message={state.message} iconUrls={abilityIconUrls} />
      <header className="arena-toolbar arena-game-header">
        <div>
          <span className="eyebrow">PvP casual · {room.format === "trio" ? "3 × 3" : "2 × 2"}</span>
          <h1>Confronto tático de equipes</h1>
          <p>
            Movimento, alcance, habilidades equipadas e turnos sincronizados para todos os
            jogadores.
          </p>
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
      <div className={`pvp-live-state ${isMyTurn ? "is-own-turn" : ""}`} role="status">
        <i />
        <strong>
          {finished
            ? "Combate encerrado"
            : isMyTurn
              ? "É a sua vez"
              : `Turno de ${state.fighters[activeId]?.name ?? "outro jogador"}`}
        </strong>
        <small>{realtimeReady ? "Sincronização ao vivo" : "Reconectando automaticamente…"}</small>
      </div>
      <div className="jrpg-turn-order">
        {state.turnOrder
          .filter((id) => (state.fighters[id]?.hp ?? 0) > 0)
          .map((id, index) => (
            <span className={activeId === id ? "is-active" : ""} key={id}>
              {index + 1}. {state.fighters[id]?.name}
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
      <div className={styles.teamBattleLayout}>
        <TeamRoster
          label="SUA EQUIPE"
          ids={ownIds}
          state={state}
          meta={meta}
          activeId={activeId}
          controlled={room.controllableCharacterIds}
          onSelect={setTargetId}
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
              const occupantId = Object.entries(state.positions ?? {}).find(
                ([, value]) => tacticalPositionKey(value) === key,
              )?.[0];
              const obstacle = map.obstacles.includes(key);
              const canMove = reachable.has(key);
              const own = occupantId ? ownIds.includes(occupantId) : false;
              return (
                <button
                  key={key}
                  type="button"
                  aria-label={
                    occupantId
                      ? state.fighters[occupantId]?.name
                      : obstacle
                        ? "Obstáculo"
                        : `Casa ${position.x + 1}, ${position.y + 1}`
                  }
                  data-state={
                    occupantId
                      ? own
                        ? "own"
                        : "enemy"
                      : obstacle
                        ? "obstacle"
                        : canMove
                          ? "reachable"
                          : undefined
                  }
                  disabled={Boolean(occupantId) || obstacle || !canMove || pending}
                  onClick={() => submit({ kind: "move", x: position.x, y: position.y })}
                >
                  {occupantId ? (
                    <span>{own ? "♞" : "♜"}</span>
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
        <TeamRoster
          label="EQUIPE ADVERSÁRIA"
          ids={enemyIds}
          state={state}
          meta={meta}
          activeId={activeId}
          controlled={[]}
          onSelect={setTargetId}
        />
      </div>
      <p className="arena-message" role="status">
        <span>Combate</span>
        {state.message}
      </p>
      {error ? <p className="arena-result__error">{error}</p> : null}
      {!finished && activeCharacter && activeFighter ? (
        <>
          {isMyTurn ? (
            <label className="combat-target-select">
              <span>Alvo da habilidade</span>
              <select value={selectedTarget} onChange={(event) => setTargetId(event.target.value)}>
                {livingTargets.map((id) => (
                  <option key={id} value={id}>
                    {ownIds.includes(id) ? "Aliado" : "Inimigo"} · {state.fighters[id]?.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <section className={styles.actionDock} aria-label="Ações PvP do Rework">
            <IconAction
              name={activeCharacter.basicAttackName ?? "Ataque básico"}
              detail={usage.basic ? "Usado" : `Alcance ${activeCharacter.basicAttackRange}`}
              iconUrl={activeCharacter.basicAttackIconUrl}
              disabled={!isMyTurn || pending || blocked || usage.basic}
              onClick={() => submit({ kind: "basic" })}
            />
            {activeCharacter.skills.map((skill) => (
              <IconAction
                key={skill.key}
                name={skill.name}
                detail={usage.class ? "Classe usada" : `Classe · alcance ${skill.range}`}
                iconUrl={skill.iconUrl}
                disabled={!isMyTurn || pending || blocked || silenced || usage.class}
                onClick={() =>
                  submit({
                    kind: "class",
                    key: skill.key,
                    targetId: skill.target === "self" ? activeId : selectedTarget,
                  })
                }
              />
            ))}
            {activeCharacter.raceAbilities.map((skill) => (
              <IconAction
                key={skill.key}
                name={skill.name}
                detail={usage.race ? "Racial usada" : `Raça · alcance ${skill.range}`}
                iconUrl={skill.iconUrl}
                disabled={!isMyTurn || pending || blocked || silenced || usage.race}
                onClick={() =>
                  submit({
                    kind: "race",
                    key: skill.key,
                    targetId: skill.target === "self" ? activeId : selectedTarget,
                  })
                }
              />
            ))}
            {activeCharacter.items.map((item) => (
              <IconAction
                key={item.id}
                name={item.name}
                detail="Item · encerra turno"
                disabled={!isMyTurn || pending || blocked}
                onClick={() => submit({ kind: "item", id: item.id })}
              />
            ))}
            <IconAction
              name="Encerrar turno"
              detail="Passar a vez"
              disabled={!isMyTurn || pending || blocked}
              onClick={() => submit({ kind: "end" })}
            />
          </section>
        </>
      ) : null}
      {finished ? (
        <CombatResultModal
          victory={winnerTeam === ownTeam}
          eyebrow="CONFRONTO DE EQUIPES ENCERRADO"
          title={
            winnerTeam === ownTeam
              ? "Sua equipe venceu o confronto."
              : state.winnerCharacterId
                ? "A equipe adversária venceu."
                : "A partida terminou sem vencedor."
          }
          description="O resultado foi registrado na Arena."
        >
          <Link className="button button--primary" href="/arena?modo=pvp">
            Buscar nova partida
          </Link>
          <Link className="button button--ghost" href="/arena">
            Voltar à Arena
          </Link>
        </CombatResultModal>
      ) : null}
    </section>
  );
}

function TeamRoster({
  label,
  ids,
  state,
  meta,
  activeId,
  controlled,
  onSelect,
}: {
  label: string;
  ids: string[];
  state: PvpDuoBattleState;
  meta: Record<string, ArenaCharacter>;
  activeId: string;
  controlled: string[];
  onSelect(id: string): void;
}) {
  return (
    <aside className={styles.teamRoster}>
      <strong>{label}</strong>
      {ids.map((id) => (
        <Fighter
          key={id}
          fighter={state.fighters[id]}
          character={meta[id]}
          active={id === activeId}
          controlled={controlled.includes(id)}
          onSelect={() => onSelect(id)}
        />
      ))}
    </aside>
  );
}
function Fighter({
  fighter,
  character,
  active,
  controlled,
  onSelect,
}: {
  fighter?: CombatantState;
  character?: ArenaCharacter;
  active: boolean;
  controlled: boolean;
  onSelect(): void;
}) {
  if (!fighter || !character) return null;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`${styles.teamFighter} ${active ? styles.activeFighter : ""}`}
      disabled={fighter.hp <= 0}
    >
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
      <span>
        <b>{character.name}</b>
        <small>
          {controlled ? "SEU PERSONAGEM" : `${character.raceName} · ${character.className}`}
        </small>
        <progress max={fighter.maxHp} value={fighter.hp} />
        <em>
          {fighter.hp.toLocaleString("pt-BR")} / {fighter.maxHp.toLocaleString("pt-BR")} HP
        </em>
        <CombatStatusDock fighter={fighter} />
      </span>
    </button>
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
function IconAction({
  name,
  detail,
  iconUrl,
  disabled,
  onClick,
}: {
  name: string;
  detail: string;
  iconUrl?: string;
  disabled: boolean;
  onClick(): void;
}) {
  return (
    <button className={styles.actionButton} disabled={disabled} onClick={onClick} type="button">
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
