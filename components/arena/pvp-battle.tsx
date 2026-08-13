"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { getPvpMatchStateAction, performPvpAction } from "@/app/arena/pvp-match-actions";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import {
  calculateDamage,
  calculateScaledPower,
  defaultCombatRules,
  getEffectiveAttributes,
} from "@/lib/game/combat";
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

  const refresh = useCallback(async () => {
    const result = await getPvpMatchStateAction(matchId);
    if (result.ok) {
      setRoom((current) => (result.data.version > current.version ? result.data : current));
    } else {
      setError(result.message);
    }
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
  const combatFeedback = /curou|recuperou/i.test(state.message)
    ? "heal"
    : /escudo|proteção/i.test(state.message)
      ? "shield"
      : /dano|atacou|causou/i.test(state.message)
        ? "damage"
        : "";
  const actorIsOwn = state.message.includes(character.name);
  const ownFeedback = combatFeedback === "damage" ? !actorIsOwn : actorIsOwn;
  const ownAttributes = getEffectiveAttributes(own);
  const enemyAttributes = getEffectiveAttributes(enemy);
  const basicDamageType = ownAttributes.INT > ownAttributes.FOR ? "magic" : "physical";
  const basicDamage = calculateDamage(
    (basicDamageType === "magic" ? ownAttributes.INT : ownAttributes.FOR) *
      defaultCombatRules.basicAttackMultiplier,
    basicDamageType,
    enemyAttributes,
  );

  function skillResource(skill: ArenaCharacter["skills"][number]) {
    if (skill.resource === "life") {
      return { current: own.hp, label: "HP" };
    }
    if (skill.resource !== "special") {
      return { current: Number.POSITIVE_INFINITY, label: "Sem custo" };
    }
    return skill.resourceKey === "race"
      ? { current: own.raceResource, label: own.raceResourceName }
      : { current: own.classResource, label: own.classResourceName };
  }

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
                  <span
                    className={`arena-map-token ${combatFeedback && ownFeedback ? `has-${combatFeedback}` : ""}`}
                    key={`own-${room.version}`}
                  >
                    <i
                      className={character.imageUrl ? "is-image" : ""}
                      style={
                        character.imageUrl
                          ? { backgroundImage: `url(${character.imageUrl})` }
                          : undefined
                      }
                    >
                      {character.imageUrl ? "" : character.name.slice(0, 2).toUpperCase()}
                    </i>
                    <progress max={own.maxHp} value={own.hp} />
                  </span>
                ) : hasEnemy ? (
                  <span
                    className={`arena-map-token ${combatFeedback && !ownFeedback ? `has-${combatFeedback}` : ""}`}
                    key={`enemy-${room.version}`}
                  >
                    <i
                      className={opponent.imageUrl ? "is-image" : ""}
                      style={
                        opponent.imageUrl
                          ? { backgroundImage: `url(${opponent.imageUrl})` }
                          : undefined
                      }
                    >
                      {opponent.imageUrl ? "" : opponent.name.slice(0, 2).toUpperCase()}
                    </i>
                    <progress max={enemy.maxHp} value={enemy.hp} />
                  </span>
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
              status={
                !isMyTurn ? "Aguarde seu turno" : state.actions.move ? "Já utilizado" : "Disponível"
              }
              tone="move"
              onClick={() => setMoving((value) => !value)}
            />
            <ActionButton
              disabled={
                !isMyTurn ||
                pending ||
                state.actions.basic ||
                state.actions.defend ||
                distance > character.basicAttackRange
              }
              origin="ATAQUE BÁSICO"
              name="Atacar"
              detail={`${basicDamage} de dano ${basicDamageType === "magic" ? "mágico" : "físico"} · alcance ${character.basicAttackRange}`}
              status={
                distance > character.basicAttackRange
                  ? "Fora de alcance"
                  : state.actions.basic
                    ? "Já utilizado"
                    : "Disponível"
              }
              tone="basic"
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
              status={
                (own.cooldowns["defesa-total"] ?? 0) > 0
                  ? `CDR ${own.cooldowns["defesa-total"]}`
                  : "Disponível"
              }
              cooldown={own.cooldowns["defesa-total"] ?? 0}
              tone="defense"
              onClick={() => submit({ kind: "defend" })}
            />
            {character.raceAbilities.map((skill) => {
              const resource = skillResource(skill);
              const cooldown = own.cooldowns[skill.key] ?? 0;
              const preview = describeSkillPower(skill, ownAttributes, enemyAttributes, own.maxHp);
              return (
                <ActionButton
                  key={skill.key}
                  disabled={
                    !isMyTurn ||
                    pending ||
                    state.actions.race ||
                    state.actions.defend ||
                    cooldown > 0 ||
                    resource.current < skill.cost ||
                    distance > skill.range
                  }
                  origin="HABILIDADE DE RAÇA"
                  name={skill.name}
                  detail={`${preview} · ${skill.cost ? `${skill.cost} ${resource.label}` : "Sem custo"} · alcance ${skill.range}`}
                  status={
                    cooldown > 0
                      ? `CDR ${cooldown} rodada${cooldown === 1 ? "" : "s"}`
                      : resource.current < skill.cost
                        ? "Recurso insuficiente"
                        : distance > skill.range
                          ? "Fora de alcance"
                          : state.actions.race
                            ? "Já utilizado"
                            : !isMyTurn
                              ? "Aguarde seu turno"
                              : "Disponível"
                  }
                  cooldown={cooldown}
                  tone="race"
                  onClick={() => submit({ kind: "race", key: skill.key })}
                />
              );
            })}
            {character.skills.map((skill) => {
              const resource = skillResource(skill);
              const cooldown = own.cooldowns[skill.key] ?? 0;
              const preview = describeSkillPower(skill, ownAttributes, enemyAttributes, own.maxHp);
              return (
                <ActionButton
                  key={skill.key}
                  disabled={
                    !isMyTurn ||
                    pending ||
                    state.actions.class ||
                    state.actions.defend ||
                    cooldown > 0 ||
                    resource.current < skill.cost ||
                    distance > skill.range
                  }
                  origin="HABILIDADE DE CLASSE"
                  name={skill.name}
                  detail={`${preview} · ${skill.cost ? `${skill.cost} ${resource.label}` : "Sem custo"} · alcance ${skill.range}`}
                  status={
                    cooldown > 0
                      ? `CDR ${cooldown} rodada${cooldown === 1 ? "" : "s"}`
                      : resource.current < skill.cost
                        ? "Recurso insuficiente"
                        : distance > skill.range
                          ? "Fora de alcance"
                          : state.actions.class
                            ? "Já utilizado"
                            : !isMyTurn
                              ? "Aguarde seu turno"
                              : "Disponível"
                  }
                  cooldown={cooldown}
                  tone="class"
                  onClick={() => submit({ kind: "class", key: skill.key })}
                />
              );
            })}
            {character.items.map((item) => (
              <ActionButton
                key={item.id}
                disabled={!isMyTurn || pending || state.actions.item || state.actions.defend}
                origin="ITEM"
                name={item.name}
                detail={item.description}
                status={state.actions.item ? "Já utilizado" : "Disponível"}
                tone="item"
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
          className={`arena-result arena-result--cinematic ${state.winnerCharacterId === ownId ? "is-victory" : "is-defeat"}`}
        >
          <div className="arena-result__crest" aria-hidden="true">
            <i />
            <b>
              <span>{state.winnerCharacterId === ownId ? "W" : "L"}</span>
            </b>
            <i />
          </div>
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
  status,
  cooldown = 0,
  tone,
  onClick,
}: {
  disabled: boolean;
  origin: string;
  name: string;
  detail: string;
  status: string;
  cooldown?: number;
  tone: "move" | "basic" | "defense" | "race" | "class" | "item";
  onClick(): void;
}) {
  return (
    <button
      className={`pvp-action is-${tone} ${cooldown > 0 ? "is-cooldown" : ""}`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {cooldown > 0 ? (
        <span className="pvp-action__cooldown" aria-label={`${cooldown} rodadas de recarga`}>
          <b>{cooldown}</b>
          <small>RODADAS</small>
        </span>
      ) : null}
      <small>{origin}</small>
      <strong>{name}</strong>
      <span>{detail}</span>
      <em className={status === "Disponível" ? "is-ready" : ""}>{status}</em>
    </button>
  );
}

function describeSkillPower(
  skill: ArenaCharacter["skills"][number],
  actorAttributes: ReturnType<typeof getEffectiveAttributes>,
  targetAttributes: ReturnType<typeof getEffectiveAttributes>,
  actorMaxHp: number,
) {
  const operation = skill.operations[0];
  if (!operation) return skill.playerDescription;
  const scaling = operation.scaling.length ? operation.scaling : skill.scaling;
  const raw = operation.base + calculateScaledPower(actorAttributes, scaling);
  if (operation.operation === "DAMAGE") {
    const type = operation.damageType === "none" ? "physical" : operation.damageType;
    const amount = calculateDamage(raw, type, targetAttributes);
    const label = type === "magic" ? "mágico" : type === "true" ? "verdadeiro" : "físico";
    return `${amount} de dano ${label}`;
  }
  if (operation.operation === "HEAL") {
    return `${raw || Math.round(actorMaxHp * 0.08)} de cura`;
  }
  if (operation.operation === "SHIELD") {
    return `${raw || Math.round(actorAttributes.ARC)} de escudo`;
  }
  const modifier = operation.modifiers[0];
  if (modifier) return `${modifier.attribute} ${modifier.value >= 0 ? "+" : ""}${modifier.value}`;
  return skill.playerDescription;
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
