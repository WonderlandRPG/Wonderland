"use client";
import { useCallback, useEffect, useState, useTransition } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { getDungeonRunAction, performDungeonAction } from "@/app/arena/dungeons/[runId]/actions";
import { firstDungeon } from "@/lib/game/dungeons";
import type { ArenaCharacter } from "@/lib/game/arena-types";
import type { DungeonBattleState } from "@/lib/game/dungeon-combat";
type Room = { runId: string; version: number; state: DungeonBattleState };
export function DungeonBattle({
  runId,
  initialRoom,
  characters,
  ownCharacterId,
}: {
  runId: string;
  initialRoom: Room;
  characters: ArenaCharacter[];
  ownCharacterId: string;
}) {
  const [room, setRoom] = useState(initialRoom),
    [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const state = room.state,
    monsterMeta = firstDungeon.encounters[state.encounterIndex],
    own = state.fighters[ownCharacterId],
    active = state.activeCharacterId === ownCharacterId && state.status === "active",
    character = characters.find((c) => c.id === ownCharacterId);
  const refresh = useCallback(
    () =>
      void getDungeonRunAction(runId).then((r) => {
        if (r.ok) setRoom((c) => (r.data.version > c.version ? r.data : c));
      }),
    [runId],
  );
  useEffect(() => {
    const client = createBrowserSupabaseClient();
    const channel = client
      ?.channel(`dungeon-run:${runId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "v2_dungeon_runs", filter: `id=eq.${runId}` },
        refresh,
      )
      .subscribe();
    const timer = window.setInterval(refresh, 2500);
    return () => {
      window.clearInterval(timer);
      if (client && channel) void client.removeChannel(channel);
    };
  }, [refresh, runId]);
  function act(input: Record<string, string>) {
    setError("");
    startTransition(async () => {
      const r = await performDungeonAction(runId, room.version, input);
      if (r.ok) setRoom(r.data);
      else setError(r.message);
    });
  }
  return (
    <section className="arena-console pvp-realtime dungeon-battle">
      <header className="arena-toolbar arena-game-header">
        <div>
          <span className="eyebrow">
            Dungeon cooperativa · encontro {state.encounterIndex + 1}/4
          </span>
          <h1>{monsterMeta.name}</h1>
          <p>
            {state.status === "active"
              ? active
                ? "Seu turno: escolha uma ação."
                : `Turno de ${state.fighters[state.activeCharacterId]?.name ?? "outro aventureiro"}.`
              : state.status === "victory"
                ? "Ruínas de Verdantia concluídas!"
                : "O grupo foi derrotado."}
          </p>
        </div>
        <div className={`pvp-live-state ${active ? "is-own" : ""}`}>
          <i />
          <small>Rodada {state.round}</small>
          <strong>{pending ? "SINCRONIZANDO…" : "AO VIVO"}</strong>
        </div>
      </header>
      <nav className="dungeon-encounters" aria-label="Progresso da Dungeon">
        {firstDungeon.encounters.map((encounter, index) => (
          <div
            className={
              index === state.encounterIndex
                ? "is-current"
                : index < state.encounterIndex
                  ? "is-cleared"
                  : ""
            }
            key={encounter.key}
          >
            <span>{index < state.encounterIndex ? "✓" : index + 1}</span>
            <small>{encounter.role}</small>
            <strong>{encounter.name}</strong>
          </div>
        ))}
      </nav>
      <div className="pvp-fighters">
        <Fighter
          name={own?.name ?? "Aventureiro"}
          image={character?.imageUrl ?? ""}
          hp={own?.hp ?? 0}
          max={own?.maxHp ?? 1}
          combatant={own}
          label="VOCÊ"
        />
        <span className="pvp-versus">
          VS<small>cooperativo</small>
        </span>
        <Fighter
          name={state.monster.name}
          image={monsterMeta.imageUrl}
          hp={state.monster.hp}
          max={state.monster.maxHp}
          combatant={state.monster}
          label={monsterMeta.role.toUpperCase()}
        />
      </div>
      <section className="dungeon-party-panel">
        <header>
          <span className="eyebrow">Grupo da expedição</span>
          <strong>
            {state.partyOrder.filter((id) => state.fighters[id].hp > 0).length}/
            {state.partyOrder.length} aventureiros de pé
          </strong>
        </header>
        <div>
          {state.partyOrder.map((id) => {
            const member = state.fighters[id];
            const meta = characters.find((entry) => entry.id === id);
            return (
              <article
                className={`${state.activeCharacterId === id ? "is-active" : ""} ${member.hp <= 0 ? "is-down" : ""}`}
                key={id}
              >
                <div style={{ backgroundImage: `url(${meta?.imageUrl ?? ""})` }} />
                <span>
                  <strong>{member.name}</strong>
                  <small>
                    {state.activeCharacterId === id
                      ? "Turno atual"
                      : member.hp <= 0
                        ? "Caído"
                        : "Em combate"}
                  </small>
                </span>
                <progress className="is-hp" max={member.maxHp} value={member.hp} />
                <b>
                  {member.hp}/{member.maxHp}
                </b>
              </article>
            );
          })}
        </div>
      </section>
      <p className="arena-message" role="status">
        <span>Combate</span>
        {state.message}
      </p>
      {error ? <p className="arena-result__error">{error}</p> : null}
      {state.status === "active" && character ? (
        <section className="arena-command-panel">
          <header>
            <div>
              <span className="eyebrow">Comandos do turno</span>
              <h2>Escolha sua ação</h2>
            </div>
          </header>
          <div className="arena-actions">
            <button
              data-action="basic"
              disabled={!active || pending}
              onClick={() => act({ kind: "basic" })}
            >
              <strong>Ataque básico</strong>
              <small>Atacar o monstro atual</small>
            </button>
            <button
              data-action="defend"
              disabled={!active || pending}
              onClick={() => act({ kind: "defend" })}
            >
              <strong>Defesa total</strong>
              <small>Bloqueia o próximo dano</small>
            </button>
            {character.skills.map((s) => (
              <button
                disabled={!active || pending || (own.cooldowns[s.key] ?? 0) > 0}
                data-action="class"
                key={s.key}
                onClick={() => act({ kind: "class", key: s.key })}
              >
                <strong>{s.name}</strong>
                <small>
                  {(own.cooldowns[s.key] ?? 0) > 0 ? `CDR ${own.cooldowns[s.key]}` : s.effect}
                </small>
              </button>
            ))}
            {character.raceAbilities.map((s) => (
              <button
                disabled={!active || pending || (own.cooldowns[s.key] ?? 0) > 0}
                data-action="race"
                key={s.key}
                onClick={() => act({ kind: "race", key: s.key })}
              >
                <strong>{s.name}</strong>
                <small>
                  {(own.cooldowns[s.key] ?? 0) > 0 ? `CDR ${own.cooldowns[s.key]}` : s.effect}
                </small>
              </button>
            ))}
          </div>
        </section>
      ) : null}
      <details className="dungeon-combat-log" open>
        <summary>
          Registro do combate <span>{state.log.length} eventos</span>
        </summary>
        <ol>
          {[...state.log].reverse().map((entry, index) => (
            <li key={`${room.version}-${index}`}>{entry}</li>
          ))}
        </ol>
      </details>
    </section>
  );
}
function Fighter({
  name,
  image,
  hp,
  max,
  combatant,
  label,
}: {
  name: string;
  image: string;
  hp: number;
  max: number;
  combatant?: DungeonBattleState["monster"];
  label: string;
}) {
  return (
    <article className="arena-fighter">
      <div
        className="arena-fighter__portrait is-image"
        style={{
          backgroundImage: `url(${image})`,
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
        }}
      >
        <span>{label}</span>
      </div>
      <div className="arena-fighter__status">
        <span className="eyebrow">{label}</span>
        <h2>{name}</h2>
        <p>
          HP{" "}
          <strong>
            {hp}/{max}
          </strong>
        </p>
        <progress className="is-hp" max={max} value={hp} />
        {combatant?.shield ? (
          <p>
            Escudo <strong>{combatant.shield}</strong>
          </p>
        ) : null}
        {combatant?.maxMana ? (
          <>
            <p>
              Mana{" "}
              <strong>
                {combatant.mana}/{combatant.maxMana}
              </strong>
            </p>
            <progress className="is-mana" max={combatant.maxMana} value={combatant.mana} />
          </>
        ) : null}
        {combatant?.maxClassResource ? (
          <>
            <p>
              {combatant.classResourceName}{" "}
              <strong>
                {combatant.classResource}/{combatant.maxClassResource}
              </strong>
            </p>
            <progress
              className="is-class-resource"
              max={combatant.maxClassResource}
              value={combatant.classResource}
            />
          </>
        ) : null}
        {Object.values(combatant?.statuses ?? {}).length ? (
          <small className="dungeon-statuses">
            {Object.values(combatant?.statuses ?? {})
              .map((status) => `${status.name} (${status.duration})`)
              .join(" · ")}
          </small>
        ) : null}
      </div>
    </article>
  );
}
