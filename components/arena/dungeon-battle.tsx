"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { getDungeonRunAction, performDungeonAction } from "@/app/arena/dungeons/[runId]/actions";
import { firstDungeon } from "@/lib/game/dungeons";
import type { ArenaCharacter } from "@/lib/game/arena-types";
import type { DungeonBattleState } from "@/lib/game/dungeon-combat";
import type { CombatantState } from "@/lib/game/combat";
import { isSilenced, isTurnBlocked } from "@/lib/game/turn-engine";

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
  const [room, setRoom] = useState(initialRoom);
  const [error, setError] = useState("");
  const [panel, setPanel] = useState<"root" | "class" | "race" | "item">("root");
  const [pending, startTransition] = useTransition();
  const state = room.state;
  const monsterMeta = firstDungeon.encounters[state.encounterIndex];
  const own = state.fighters[ownCharacterId];
  const character = characters.find((entry) => entry.id === ownCharacterId);
  const active = state.activeCharacterId === ownCharacterId && state.status === "active";
  const blocked = own ? isTurnBlocked(own) : false;
  const silenced = own ? isSilenced(own) : false;

  const refresh = useCallback(() => {
    void getDungeonRunAction(runId).then((result) => {
      if (result.ok) setRoom((current) => (result.data.version > current.version ? result.data : current));
    });
  }, [runId]);

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
    if (!active || pending || blocked) return;
    setError("");
    startTransition(async () => {
      const result = await performDungeonAction(runId, room.version, input);
      if (result.ok) {
        setRoom(result.data);
        setPanel("root");
      } else setError(result.message);
    });
  }

  return (
    <section className="arena-console pvp-realtime dungeon-battle jrpg-battle">
      <header className="arena-toolbar arena-game-header">
        <div>
          <span className="eyebrow">Dungeon · encontro {state.encounterIndex + 1}/{firstDungeon.encounters.length}</span>
          <h1>{monsterMeta.name}</h1>
          <p>
            {state.status === "active"
              ? active
                ? blocked ? "Seu personagem está incapacitado." : "Seu turno: escolha uma ação."
                : state.activeCharacterId === state.monster.id
                  ? `${state.monster.name} está agindo.`
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
          <div className={index === state.encounterIndex ? "is-current" : index < state.encounterIndex ? "is-cleared" : ""} key={encounter.key}>
            <span>{index < state.encounterIndex ? "✓" : index + 1}</span>
            <small>{encounter.role}</small>
            <strong>{encounter.name}</strong>
          </div>
        ))}
      </nav>

      <div className="jrpg-turn-order" aria-label="Ordem dos turnos">
        {state.turnOrder.map((id, index) => {
          const fighter = id === state.monster.id ? state.monster : state.fighters[id];
          if (!fighter || fighter.hp <= 0) return null;
          return (
            <span className={state.activeCharacterId === id ? "is-active" : ""} key={id}>
              {index + 1}. {fighter.name}
            </span>
          );
        })}
      </div>

      <div className="pvp-fighters jrpg-stage dungeon-jrpg-stage">
        <PartyStage state={state} characters={characters} ownCharacterId={ownCharacterId} />
        <span className="pvp-versus">VS<small>{monsterMeta.role}</small></span>
        <CombatantCard fighter={state.monster} name={state.monster.name} subtitle={monsterMeta.role} imageUrl={monsterMeta.imageUrl} active={state.activeCharacterId === state.monster.id} />
      </div>

      <p className="arena-message" role="status"><span>Combate</span>{state.message}</p>
      {error ? <p className="arena-result__error">{error}</p> : null}

      {state.status === "active" && character && own ? (
        <section className="arena-command-panel jrpg-command-panel">
          <header>
            <div><span className="eyebrow">Comandos</span><h2>{active ? blocked ? "Turno incapacitado" : "Escolha uma ação" : "Aguardando seu turno"}</h2></div>
            <small>{silenced ? "Silenciado: habilidades bloqueadas." : "Uma ação por turno."}</small>
          </header>
          {panel === "root" ? (
            <div className="pvp-actions-grid jrpg-actions">
              <Command disabled={!active || pending || blocked} name="Atacar" detail="Ataque básico" onClick={() => act({ kind: "basic" })} />
              <Command disabled={!active || pending || blocked || silenced || character.skills.length === 0} name="Habilidades" detail={`${character.skills.length} de classe`} onClick={() => setPanel("class")} />
              <Command disabled={!active || pending || blocked || silenced || character.raceAbilities.length === 0} name="Raça" detail={`${character.raceAbilities.length} racial(is)`} onClick={() => setPanel("race")} />
              <Command disabled={!active || pending || blocked || character.items.length === 0} name="Item" detail={`${character.items.length} disponível(is)`} onClick={() => setPanel("item")} />
              <Command disabled={!active || pending || blocked || (own.cooldowns["defesa-total"] ?? 0) > 0} name="Defender" detail="Bloqueia o próximo dano" onClick={() => act({ kind: "defend" })} />
            </div>
          ) : (
            <div className="jrpg-submenu">
              <button className="button button--ghost" type="button" onClick={() => setPanel("root")}>← Voltar</button>
              {panel === "class" ? character.skills.map((skill) => <SkillCommand key={skill.key} fighter={own} skill={skill} disabled={silenced || blocked} onClick={() => act({ kind: "class", key: skill.key })} />) : null}
              {panel === "race" ? character.raceAbilities.map((skill) => <SkillCommand key={skill.key} fighter={own} skill={skill} disabled={silenced || blocked} onClick={() => act({ kind: "race", key: skill.key })} />) : null}
              {panel === "item" ? character.items.map((item) => <Command key={item.id} disabled={!active || pending || blocked} name={item.name} detail={item.description || "Usar item"} onClick={() => act({ kind: "item", id: item.id })} />) : null}
            </div>
          )}
        </section>
      ) : null}

      {state.status !== "active" ? (
        <section className="arena-result">
          <span>{state.status === "victory" ? "DUNGEON CONCLUÍDA" : "EXPEDIÇÃO FRACASSOU"}</span>
          <h2>{state.status === "victory" ? "O grupo venceu todos os encontros." : "Todos os aventureiros caíram."}</h2>
        </section>
      ) : null}

      <details className="dungeon-combat-log" open>
        <summary>Registro do combate <span>{state.log.length} eventos</span></summary>
        <ol>{[...state.log].reverse().map((entry, index) => <li key={`${room.version}-${index}`}>{entry}</li>)}</ol>
      </details>
    </section>
  );
}

function PartyStage({ state, characters, ownCharacterId }: { state: DungeonBattleState; characters: ArenaCharacter[]; ownCharacterId: string }) {
  return (
    <div className="jrpg-party-stage">
      {state.partyOrder.map((id) => {
        const fighter = state.fighters[id];
        const meta = characters.find((entry) => entry.id === id);
        if (!fighter) return null;
        return (
          <CombatantCard
            key={id}
            fighter={fighter}
            name={fighter.name}
            subtitle={`${meta?.raceName ?? ""} · ${meta?.className ?? ""}${id === ownCharacterId ? " · VOCÊ" : ""}`}
            imageUrl={meta?.imageUrl ?? ""}
            active={state.activeCharacterId === id}
            compact
          />
        );
      })}
    </div>
  );
}

function CombatantCard({ fighter, name, subtitle, imageUrl, active, compact = false }: { fighter: CombatantState; name: string; subtitle: string; imageUrl: string; active: boolean; compact?: boolean }) {
  const statuses = Object.values(fighter.statuses);
  return (
    <article className={`pvp-fighter jrpg-fighter ${compact ? "is-compact" : ""} ${active ? "is-active" : ""} ${fighter.hp <= 0 ? "is-down" : ""}`}>
      <div className="jrpg-fighter__portrait" style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}>{!imageUrl ? name.slice(0, 2).toUpperCase() : null}</div>
      <h3>{name}</h3><p>{subtitle}</p>
      <progress max={fighter.maxHp} value={fighter.hp} />
      <strong>{fighter.hp.toLocaleString("pt-BR")} / {fighter.maxHp.toLocaleString("pt-BR")} HP</strong>
      <div className="jrpg-resources">
        {fighter.maxMana > 0 ? <em>Mana: {fighter.mana}/{fighter.maxMana}</em> : null}
        {fighter.maxClassResource > 0 ? <em>{fighter.classResourceName}: {fighter.classResource}/{fighter.maxClassResource}</em> : null}
        {fighter.maxRaceResource > 0 ? <em>{fighter.raceResourceName}: {fighter.raceResource}/{fighter.maxRaceResource}</em> : null}
        {fighter.shield > 0 ? <em>Escudo: {fighter.shield}</em> : null}
      </div>
      {statuses.length ? <div className="jrpg-statuses">{statuses.map((status) => <span key={`${status.name}-${status.duration}`}>{status.name} · {status.duration}T</span>)}</div> : null}
    </article>
  );
}

function SkillCommand({ fighter, skill, disabled, onClick }: { fighter: CombatantState; skill: ArenaCharacter["skills"][number]; disabled: boolean; onClick(): void }) {
  const cooldown = fighter.cooldowns[skill.key] ?? 0;
  const available = skill.resource === "mana" ? fighter.mana : skill.resource === "life" ? fighter.hp : skill.resource === "special" ? (skill.resourceKey === "race" ? fighter.raceResource : fighter.classResource) : Number.POSITIVE_INFINITY;
  const label = skill.resource === "none" ? "Sem custo" : `${skill.cost} ${skill.resource === "mana" ? "Mana" : skill.resource === "life" ? "HP" : skill.resourceKey === "race" ? fighter.raceResourceName : fighter.classResourceName}`;
  return <Command disabled={disabled || cooldown > 0 || available < skill.cost} name={skill.name} detail={`${label}${cooldown ? ` · recarga ${cooldown}` : ""}`} onClick={onClick} />;
}

function Command({ name, detail, disabled, onClick }: { name: string; detail: string; disabled: boolean; onClick(): void }) {
  return <button className="arena-action-card jrpg-action" disabled={disabled} onClick={onClick} type="button"><strong>{name}</strong><small>{detail}</small></button>;
}
