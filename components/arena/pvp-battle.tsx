"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { getPvpMatchStateAction, performPvpAction } from "@/app/arena/pvp-match-actions";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import type { ArenaCharacter, PvpRoomSnapshot } from "@/lib/game/arena-types";
import type { CombatantState } from "@/lib/game/combat";
import { isSilenced, isTurnBlocked } from "@/lib/game/turn-engine";

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
  const [pending, startTransition] = useTransition();
  const [clock, setClock] = useState(() => Date.now());
  const state = room.state;
  const ownId = room.ownCharacterId;
  const enemyId = room.opponentCharacterId;
  const own = state.fighters[ownId];
  const enemy = state.fighters[enemyId];
  const isMyTurn = state.status === "active" && state.activeCharacterId === ownId;
  const finished = state.status !== "active";
  const seconds = Math.max(0, Math.ceil((Date.parse(state.turnEndsAt) - clock) / 1000));
  const commandsBlocked = isTurnBlocked(own);
  const silenced = isSilenced(own);

  const refresh = useCallback(async () => {
    const result = await getPvpMatchStateAction(matchId);
    if (result.ok) setRoom((current) => (result.data.version > current.version ? result.data : current));
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
    if (seconds !== 0 || !isMyTurn || pending || finished) return;
    void submit({ kind: "end" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds, isMyTurn, room.version, finished]);

  async function submit(action: Record<string, unknown>) {
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
          <h1>{character.name} contra {opponent.name}</h1>
          <p>Uma ação por turno. A iniciativa define a ordem do duelo.</p>
        </div>
        <div className={`pvp-live-state ${isMyTurn ? "is-own" : ""}`}>
          <i />
          <small>{finished ? "Partida encerrada" : isMyTurn ? "Seu turno" : `Turno de ${enemy.name}`}</small>
          <strong>{pending ? "Sincronizando…" : "AO VIVO"}</strong>
        </div>
        <strong className={`arena-turn-timer ${seconds <= 10 ? "is-ending" : ""}`}>
          <small>Tempo</small>{String(seconds).padStart(2, "0")}s
        </strong>
        <strong className="arena-turn-counter">
          <small>Rodada</small>{String(state.round).padStart(2, "0")}
        </strong>
      </header>

      <div className="jrpg-turn-order" aria-label="Ordem dos turnos">
        {state.turnOrder.map((id, index) => (
          <span className={state.activeCharacterId === id ? "is-active" : ""} key={id}>
            {index + 1}. {state.fighters[id]?.name ?? "Combatente"}
          </span>
        ))}
      </div>

      <div className="pvp-fighters jrpg-stage">
        <Fighter fighter={own} character={character} active={state.activeCharacterId === ownId} label="VOCÊ" />
        <span className="pvp-versus">VS<small>turnos</small></span>
        <Fighter fighter={enemy} character={opponent} active={state.activeCharacterId === enemyId} label="OPONENTE" />
      </div>

      <p className="arena-message" role="status"><span>Registro</span>{state.message}</p>
      {error ? <p className="arena-result__error pvp-sync-error">{error}</p> : null}

      {!finished ? (
        <section className="arena-command-panel pvp-command-panel jrpg-command-panel">
          <header>
            <div>
              <span className="eyebrow">Comandos</span>
              <h2>{isMyTurn ? commandsBlocked ? "Turno incapacitado" : "Escolha uma ação" : "Aguardando o adversário"}</h2>
            </div>
            <small>{silenced ? "Silenciado: habilidades estão bloqueadas." : "Cada comando encerra o seu turno."}</small>
          </header>

          {panel === "root" ? (
            <div className="pvp-actions-grid jrpg-actions">
              <Command disabled={!isMyTurn || pending || commandsBlocked} name="Atacar" detail="Ataque básico" onClick={() => submit({ kind: "basic" })} />
              <Command disabled={!isMyTurn || pending || commandsBlocked || silenced || character.skills.length === 0} name="Habilidades" detail={`${character.skills.length} de classe`} onClick={() => setPanel("class")} />
              <Command disabled={!isMyTurn || pending || commandsBlocked || silenced || character.raceAbilities.length === 0} name="Raça" detail={`${character.raceAbilities.length} racial(is)`} onClick={() => setPanel("race")} />
              <Command disabled={!isMyTurn || pending || commandsBlocked || character.items.length === 0} name="Item" detail={`${character.items.length} disponível(is)`} onClick={() => setPanel("item")} />
              <Command disabled={!isMyTurn || pending || commandsBlocked || (own.cooldowns["defesa-total"] ?? 0) > 0} name="Defender" detail="Bloqueia o próximo dano" onClick={() => submit({ kind: "defend" })} />
              <Command disabled={!isMyTurn || pending || commandsBlocked} name="Aguardar" detail="Passa o turno" onClick={() => submit({ kind: "end" })} />
            </div>
          ) : (
            <div className="jrpg-submenu">
              <button className="button button--ghost" type="button" onClick={() => setPanel("root")}>← Voltar</button>
              {panel === "class" ? character.skills.map((skill) => (
                <SkillButton key={skill.key} fighter={own} skill={skill} disabled={!isMyTurn || pending || commandsBlocked || silenced} onClick={() => submit({ kind: "class", key: skill.key })} />
              )) : null}
              {panel === "race" ? character.raceAbilities.map((skill) => (
                <SkillButton key={skill.key} fighter={own} skill={skill} disabled={!isMyTurn || pending || commandsBlocked || silenced} onClick={() => submit({ kind: "race", key: skill.key })} />
              )) : null}
              {panel === "item" ? character.items.map((item) => (
                <Command key={item.id} disabled={!isMyTurn || pending || commandsBlocked} name={item.name} detail={item.description || "Usar item"} onClick={() => submit({ kind: "item", id: item.id })} />
              )) : null}
            </div>
          )}
        </section>
      ) : (
        <section className="arena-result">
          <span>{state.winnerCharacterId === ownId ? "VITÓRIA" : "DERROTA"}</span>
          <h2>{state.winnerCharacterId === ownId ? `${character.name} venceu!` : `${opponent.name} venceu.`}</h2>
        </section>
      )}
    </section>
  );
}

function Fighter({ fighter, character, active, label }: { fighter: CombatantState; character: ArenaCharacter; active: boolean; label: string }) {
  const statuses = Object.values(fighter.statuses);
  return (
    <article className={`pvp-fighter jrpg-fighter ${active ? "is-active" : ""}`}>
      <small>{label}</small>
      <div className="jrpg-fighter__portrait" style={character.imageUrl ? { backgroundImage: `url(${character.imageUrl})` } : undefined}>
        {!character.imageUrl ? character.name.slice(0, 2).toUpperCase() : null}
      </div>
      <h3>{fighter.name}</h3>
      <p>{character.raceName} · {character.className}</p>
      <progress max={fighter.maxHp} value={fighter.hp} />
      <strong>{fighter.hp.toLocaleString("pt-BR")} / {fighter.maxHp.toLocaleString("pt-BR")} HP</strong>
      <div className="jrpg-resources">
        {fighter.maxMana > 0 ? <em>Mana: {fighter.mana}/{fighter.maxMana}</em> : null}
        {fighter.maxClassResource > 0 ? <em>{fighter.classResourceName}: {fighter.classResource}/{fighter.maxClassResource}</em> : null}
        {fighter.maxRaceResource > 0 ? <em>{fighter.raceResourceName}: {fighter.raceResource}/{fighter.maxRaceResource}</em> : null}
        {fighter.shield > 0 ? <em>Escudo: {fighter.shield}</em> : null}
      </div>
      {statuses.length ? (
        <div className="jrpg-statuses">
          {statuses.map((status) => <span key={`${status.name}-${status.duration}`}>{status.name} · {status.duration}T</span>)}
        </div>
      ) : null}
    </article>
  );
}

function SkillButton({ fighter, skill, disabled, onClick }: { fighter: CombatantState; skill: ArenaCharacter["skills"][number]; disabled: boolean; onClick(): void }) {
  const cooldown = fighter.cooldowns[skill.key] ?? 0;
  const available = skill.resource === "mana" ? fighter.mana : skill.resource === "life" ? fighter.hp : skill.resource === "special" ? (skill.resourceKey === "race" ? fighter.raceResource : fighter.classResource) : Number.POSITIVE_INFINITY;
  const blocked = cooldown > 0 || available < skill.cost;
  const cost = skill.resource === "none" ? "Sem custo" : `${skill.cost} ${skill.resource === "mana" ? "Mana" : skill.resource === "life" ? "HP" : skill.resourceKey === "race" ? fighter.raceResourceName : fighter.classResourceName}`;
  return <Command disabled={disabled || blocked} name={skill.name} detail={`${cost}${cooldown ? ` · recarga ${cooldown}` : ""}`} onClick={onClick} />;
}

function Command({ name, detail, disabled, onClick }: { name: string; detail: string; disabled: boolean; onClick(): void }) {
  return (
    <button className="arena-action-card jrpg-action" disabled={disabled} onClick={onClick} type="button">
      <strong>{name}</strong><small>{detail}</small>
    </button>
  );
}
