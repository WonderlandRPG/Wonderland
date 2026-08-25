"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { getPvpMatchStateAction, performPvpAction } from "@/app/arena/pvp-match-actions";
import { CharacterPortraitCard } from "@/components/characters/character-portrait-card";
import { CombatSkillCard } from "@/components/arena/combat-skill-card";
import { CombatStatusDock } from "@/components/arena/combat-status-dock";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import type { ArenaCharacter, PvpRoomSnapshot } from "@/lib/game/arena-types";
import { defaultCombatRules, type CombatantState } from "@/lib/game/combat";
import { createTurnActionUsage, isSilenced, isTurnBlocked } from "@/lib/game/turn-engine";

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
  const [panel, setPanel] = useState<"root" | "class" | "race" | "item">("root");
  const [selectedTargetId, setSelectedTargetId] = useState("");
  const [pending, startTransition] = useTransition();
  const [clock, setClock] = useState(() => Date.now());
  const [fx, setFx] = useState<Fx>(null);
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
  const chosenTargetId = selectedTargetId || enemyId;
  const chosenTarget = chosenTargetId === ownId ? own : enemy;

  const refresh = useCallback(async () => {
    const result = await getPvpMatchStateAction(matchId);
    if (result.ok)
      setRoom((current) => (result.data.version > current.version ? result.data : current));
    else setError(result.message);
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
    if (seconds !== 0 || !isMyTurn || pending || finished) return;
    void submit({ kind: "end" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds, isMyTurn, room.version, finished]);

  function submit(action: Record<string, unknown>) {
    if (pending || !isMyTurn || finished) return;
    setError("");
    startTransition(async () => {
      const result = await performPvpAction(matchId, room.version, action);
      if (result.data) setRoom(result.data);
      if (!result.ok) setError(result.message);
      else setPanel("root");
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

      <div className="pvp-fighters jrpg-stage">
        <Fighter
          fighter={own}
          character={character}
          active={state.activeCharacterId === ownId}
          label="VOCÊ"
          fx={fx?.target === "own" ? fx : null}
        />
        <span className="pvp-versus">
          VS<small>turnos</small>
        </span>
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
        <section className="arena-command-panel pvp-command-panel jrpg-command-panel">
          <header>
            <div>
              <span className="eyebrow">Comandos</span>
              <h2>
                {isMyTurn
                  ? commandsBlocked
                    ? "Turno incapacitado"
                    : "Monte sua sequência"
                  : "Aguardando o adversário"}
              </h2>
            </div>
            <small>
              {silenced
                ? "Silenciado: habilidades estão bloqueadas."
                : "Curas e buffs usam seu personagem; debuffs e ataques usam o oponente."}
            </small>
          </header>

          {isMyTurn ? (
            <label className="combat-target-select">
              <span>Alvo da habilidade</span>
              <select
                value={chosenTargetId}
                onChange={(event) => setSelectedTargetId(event.target.value)}
              >
                <option value={ownId}>Você · {character.name}</option>
                <option value={enemyId}>Oponente · {opponent.name}</option>
              </select>
            </label>
          ) : null}

          {panel === "root" ? (
            <div className="pvp-actions-grid jrpg-actions">
              <Command
                used={usage.basic}
                disabled={!isMyTurn || pending || commandsBlocked || usage.basic}
                name="Atacar"
                detail={usage.basic ? "Já usado neste turno" : "Ataque básico"}
                onClick={() => submit({ kind: "basic" })}
              />
              <Command
                used={usage.class}
                disabled={
                  !isMyTurn ||
                  pending ||
                  commandsBlocked ||
                  silenced ||
                  character.skills.length === 0 ||
                  usage.class
                }
                name="Habilidades"
                detail={usage.class ? "Classe já usada" : `${character.skills.length} de classe`}
                onClick={() => setPanel("class")}
              />
              <Command
                used={usage.race}
                disabled={
                  !isMyTurn ||
                  pending ||
                  commandsBlocked ||
                  silenced ||
                  character.raceAbilities.length === 0 ||
                  usage.race
                }
                name="Raça"
                detail={
                  usage.race ? "Racial já usada" : `${character.raceAbilities.length} racial(is)`
                }
                onClick={() => setPanel("race")}
              />
              <Command
                disabled={!isMyTurn || pending || commandsBlocked || character.items.length === 0}
                name="Item"
                detail={`${character.items.length} disponível(is) · encerra turno`}
                onClick={() => setPanel("item")}
              />
              <Command
                disabled={!isMyTurn || pending || commandsBlocked}
                name="Encerrar turno"
                detail="Finaliza sua sequência"
                onClick={() => submit({ kind: "end" })}
              />
            </div>
          ) : (
            <div className="jrpg-submenu combat-skill-list">
              <button
                className="button button--ghost"
                type="button"
                onClick={() => setPanel("root")}
              >
                ← Voltar
              </button>
              {panel === "class"
                ? character.skills.map((skill) => (
                    <CombatSkillCard
                      key={skill.key}
                      fighter={own}
                      target={skill.target === "self" ? own : chosenTarget}
                      rules={defaultCombatRules}
                      skill={skill}
                      disabled={!isMyTurn || pending || commandsBlocked || silenced}
                      used={usage.class}
                      onClick={() =>
                        submit({ kind: "class", key: skill.key, targetId: chosenTargetId })
                      }
                    />
                  ))
                : null}
              {panel === "race"
                ? character.raceAbilities.map((skill) => (
                    <CombatSkillCard
                      key={skill.key}
                      fighter={own}
                      target={skill.target === "self" ? own : chosenTarget}
                      rules={defaultCombatRules}
                      skill={skill}
                      disabled={!isMyTurn || pending || commandsBlocked || silenced}
                      used={usage.race}
                      onClick={() =>
                        submit({ kind: "race", key: skill.key, targetId: chosenTargetId })
                      }
                    />
                  ))
                : null}
              {panel === "item"
                ? character.items.map((item) => (
                    <Command
                      key={item.id}
                      disabled={!isMyTurn || pending || commandsBlocked}
                      name={item.name}
                      detail={`${item.description || "Usar item"} · encerra turno`}
                      onClick={() => submit({ kind: "item", id: item.id })}
                    />
                  ))
                : null}
            </div>
          )}
        </section>
      ) : (
        <section className="arena-result">
          <span>{state.winnerCharacterId === ownId ? "VITÓRIA" : "DERROTA"}</span>
          <h2>
            {state.winnerCharacterId === ownId
              ? `${character.name} venceu!`
              : state.winnerCharacterId
                ? `${opponent.name} venceu.`
                : "O duelo terminou em derrota por desistência."}
          </h2>
        </section>
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

function Command({
  name,
  detail,
  disabled,
  used = false,
  onClick,
}: {
  name: string;
  detail: string;
  disabled: boolean;
  used?: boolean;
  onClick(): void;
}) {
  return (
    <button
      className={`arena-action-card jrpg-action ${used ? "is-used" : ""}`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <strong>{name}</strong>
      <small>{detail}</small>
    </button>
  );
}
