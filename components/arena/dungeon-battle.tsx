"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { getDungeonRunAction, performDungeonAction } from "@/app/arena/dungeons/[runId]/actions";
import { CharacterPortraitCard } from "@/components/characters/character-portrait-card";
import { CombatSkillCard } from "@/components/arena/combat-skill-card";
import { CombatStatusDock } from "@/components/arena/combat-status-dock";
import { CombatResultModal } from "@/components/arena/combat-result-modal";
import { firstDungeon } from "@/lib/game/dungeons";
import type { ArenaCharacter } from "@/lib/game/arena-types";
import type { DungeonBattleState } from "@/lib/game/dungeon-combat";
import { defaultCombatRules, type CombatantState } from "@/lib/game/combat";
import { createTurnActionUsage, isSilenced, isTurnBlocked } from "@/lib/game/turn-engine";

type Room = { runId: string; version: number; state: DungeonBattleState };
type Fx = { targetId: string; kind: "damage" | "heal" | "shield"; token: number } | null;

export function DungeonBattle({ runId, initialRoom, characters, ownCharacterId }: {
  runId: string;
  initialRoom: Room;
  characters: ArenaCharacter[];
  ownCharacterId: string;
}) {
  const [room, setRoom] = useState(initialRoom);
  const [error, setError] = useState("");
  const [panel, setPanel] = useState<"root" | "class" | "race" | "item">("root");
  const [selectedTargetId, setSelectedTargetId] = useState(initialRoom.state.monster.id);
  const [pending, startTransition] = useTransition();
  const [fx, setFx] = useState<Fx>(null);
  const state = room.state;
  const monsterMeta = firstDungeon.encounters[state.encounterIndex];
  const own = state.fighters[ownCharacterId];
  const character = characters.find((entry) => entry.id === ownCharacterId);
  const usage = state.turnActions ?? createTurnActionUsage();
  const active = state.activeCharacterId === ownCharacterId && state.status === "active";
  const blocked = own ? isTurnBlocked(own) : false;
  const silenced = own ? isSilenced(own) : false;
  const livingParty = state.partyOrder.filter((id) => (state.fighters[id]?.hp ?? 0) > 0);
  const validTargetIds = [...livingParty, state.monster.id];
  const chosenTargetId = validTargetIds.includes(selectedTargetId) ? selectedTargetId : state.monster.id;
  const chosenTarget = chosenTargetId === state.monster.id ? state.monster : state.fighters[chosenTargetId];
  const previous = useRef<Record<string, { hp: number; shield: number }>>({
    ...Object.fromEntries(Object.values(state.fighters).map((fighter) => [fighter.id, { hp: fighter.hp, shield: fighter.shield }])),
    [state.monster.id]: { hp: state.monster.hp, shield: state.monster.shield },
  });

  const refresh = useCallback(() => {
    void getDungeonRunAction(runId).then((result) => {
      if (result.ok) setRoom((current) => result.data.version > current.version ? result.data : current);
    });
  }, [runId]);

  useEffect(() => {
    const client = createBrowserSupabaseClient();
    const channel = client?.channel(`dungeon-run:${runId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "v2_dungeon_runs", filter: `id=eq.${runId}` }, refresh)
      .subscribe();
    const timer = window.setInterval(refresh, 2500);
    return () => {
      window.clearInterval(timer);
      if (client && channel) void client.removeChannel(channel);
    };
  }, [refresh, runId]);

  useEffect(() => {
    const fighters = [...Object.values(state.fighters), state.monster];
    for (const fighter of fighters) {
      const old = previous.current[fighter.id];
      if (!old) continue;
      if (fighter.hp < old.hp) { setFx({ targetId: fighter.id, kind: "damage", token: Date.now() }); break; }
      if (fighter.hp > old.hp) { setFx({ targetId: fighter.id, kind: "heal", token: Date.now() }); break; }
      if (fighter.shield > old.shield) { setFx({ targetId: fighter.id, kind: "shield", token: Date.now() }); break; }
    }
    previous.current = Object.fromEntries(fighters.map((fighter) => [fighter.id, { hp: fighter.hp, shield: fighter.shield }]));
  }, [room.version, state.fighters, state.monster]);

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
          <p>{state.status === "active" ? active ? blocked ? "Seu personagem está incapacitado." : "Seu turno: combine Ataque + Classe + Raça." : state.activeCharacterId === state.monster.id ? `${state.monster.name} está agindo.` : `Turno de ${state.fighters[state.activeCharacterId]?.name ?? "outro aventureiro"}.` : state.status === "victory" ? "Ruínas de Verdantia concluídas!" : "O grupo foi derrotado."}</p>
        </div>
        <div className={`pvp-live-state ${active ? "is-own" : ""}`}><i /><small>Rodada {state.round}</small><strong>{pending ? "SINCRONIZANDO…" : "AO VIVO"}</strong></div>
      </header>

      <nav className="dungeon-encounters" aria-label="Progresso da Dungeon">
        {firstDungeon.encounters.map((encounter, index) => <div className={index === state.encounterIndex ? "is-current" : index < state.encounterIndex ? "is-cleared" : ""} key={encounter.key}><span>{index < state.encounterIndex ? "✓" : index + 1}</span><small>{encounter.role}</small><strong>{encounter.name}</strong></div>)}
      </nav>

      <div className="jrpg-turn-order">{state.turnOrder.map((id, index) => { const fighter = id === state.monster.id ? state.monster : state.fighters[id]; return !fighter || fighter.hp <= 0 ? null : <span className={state.activeCharacterId === id ? "is-active" : ""} key={id}>{index + 1}. {fighter.name}</span>; })}</div>
      {active ? <div className="turn-action-economy"><ActionSlot label="Ataque" used={usage.basic} /><ActionSlot label="Classe" used={usage.class} /><ActionSlot label="Raça" used={usage.race} /></div> : null}

      <div className="pvp-fighters jrpg-stage dungeon-jrpg-stage">
        <div className="jrpg-party-stage">{state.partyOrder.map((id) => { const fighter=state.fighters[id]; const meta=characters.find((entry)=>entry.id===id); return !fighter||!meta?null:<CharacterCard key={id} fighter={fighter} character={meta} active={state.activeCharacterId===id} own={id===ownCharacterId} fx={fx?.targetId===id?fx:null}/>; })}</div>
        <span className="pvp-versus">VS<small>{monsterMeta.role}</small></span>
        <MonsterCard fighter={state.monster} name={state.monster.name} subtitle={monsterMeta.role} imageUrl={monsterMeta.imageUrl} active={state.activeCharacterId === state.monster.id} fx={fx?.targetId===state.monster.id?fx:null} />
      </div>

      <p className="arena-message" role="status"><span>Combate</span>{state.message}</p>
      {error ? <p className="arena-result__error">{error}</p> : null}

      {state.status === "active" && character && own ? (
        <section className="arena-command-panel jrpg-command-panel">
          <header><div><span className="eyebrow">Comandos</span><h2>{active ? blocked ? "Turno incapacitado" : "Monte sua sequência" : "Aguardando seu turno"}</h2></div><small>{silenced ? "Silenciado: habilidades bloqueadas." : "Escolha um aliado para cura/buff ou o monstro para dano/debuff."}</small></header>
          {active ? <label className="combat-target-select"><span>Alvo da habilidade</span><select value={chosenTargetId} onChange={(event) => setSelectedTargetId(event.target.value)}>{livingParty.map((id)=><option key={id} value={id}>Aliado · {state.fighters[id]?.name}</option>)}<option value={state.monster.id}>Inimigo · {state.monster.name}</option></select></label> : null}
          {panel === "root" ? (
            <div className="pvp-actions-grid jrpg-actions">
              <Command used={usage.basic} disabled={!active || pending || blocked || usage.basic} name="Atacar" detail={usage.basic ? "Já usado neste turno" : "Ataque básico"} onClick={() => act({ kind: "basic" })} />
              <Command used={usage.class} disabled={!active || pending || blocked || silenced || character.skills.length === 0 || usage.class} name="Habilidades" detail={usage.class ? "Classe já usada" : `${character.skills.length} de classe`} onClick={() => setPanel("class")} />
              <Command used={usage.race} disabled={!active || pending || blocked || silenced || character.raceAbilities.length === 0 || usage.race} name="Raça" detail={usage.race ? "Racial já usada" : `${character.raceAbilities.length} racial(is)`} onClick={() => setPanel("race")} />
              <Command disabled={!active || pending || blocked || character.items.length === 0} name="Item" detail={`${character.items.length} disponível(is) · encerra turno`} onClick={() => setPanel("item")} />
              <Command disabled={!active || pending || blocked} name="Encerrar turno" detail="Finaliza sua sequência" onClick={() => act({ kind: "end" })} />
            </div>
          ) : (
            <div className="jrpg-submenu combat-skill-list">
              <button className="button button--ghost" type="button" onClick={() => setPanel("root")}>← Voltar</button>
              {panel === "class" ? character.skills.map((skill) => <CombatSkillCard key={skill.key} fighter={own} target={skill.target === "self" ? own : chosenTarget} rules={defaultCombatRules} skill={skill} disabled={silenced || blocked || pending} used={usage.class} onClick={() => act({ kind: "class", key: skill.key, targetId: chosenTargetId })} />) : null}
              {panel === "race" ? character.raceAbilities.map((skill) => <CombatSkillCard key={skill.key} fighter={own} target={skill.target === "self" ? own : chosenTarget} rules={defaultCombatRules} skill={skill} disabled={silenced || blocked || pending} used={usage.race} onClick={() => act({ kind: "race", key: skill.key, targetId: chosenTargetId })} />) : null}
              {panel === "item" ? character.items.map((item) => <Command key={item.id} disabled={!active || pending || blocked} name={item.name} detail={`${item.description || "Usar item"} · encerra turno`} onClick={() => act({ kind: "item", id: item.id })} />) : null}
            </div>
          )}
        </section>
      ) : null}

      {state.status !== "active" ? <CombatResultModal victory={state.status === "victory"} eyebrow={state.status === "victory" ? "DUNGEON CONCLUÍDA" : "EXPEDIÇÃO FRACASSOU"} title={state.status === "victory" ? "O grupo venceu todos os encontros." : state.message.includes("desist") ? "O grupo confirmou a desistência e saiu derrotado." : "Todos os aventureiros caíram."} description={state.status === "victory" ? "A Guilda registrou o feito de todos os integrantes." : "A expedição terminou, mas uma nova tentativa ainda poderá mudar esse destino."}><Link className="button button--primary" href="/arena/dungeons">Voltar às Dungeons</Link></CombatResultModal> : null}
      <details className="dungeon-combat-log" open><summary>Registro do combate <span>{state.log.length} eventos</span></summary><ol>{[...state.log].reverse().map((entry,index)=><li key={`${room.version}-${index}`}>{entry}</li>)}</ol></details>
    </section>
  );
}

function ActionSlot({label,used}:{label:string;used:boolean}){return <span className={used?"is-used":""}><i>{used?"✓":"•"}</i>{label}<small>{used?"usado":"disponível"}</small></span>}
function CharacterCard({fighter,character,active,own,fx}:{fighter:CombatantState;character:ArenaCharacter;active:boolean;own:boolean;fx:Fx}){return <article className={`pvp-fighter jrpg-fighter is-compact ${active?"is-active":""} ${fighter.hp<=0?"is-down":""} ${fx?`fx-${fx.kind}`:""}`}><div className="combat-identity-frame"><CharacterPortraitCard name={character.name} imageUrl={character.imageUrl||null} rank={character.adventureRank} level={character.level} title={character.equippedTitle} variant="compact" className="combat-official-character-card" />{fx?<span key={fx.token} className={`combat-fx combat-fx--${fx.kind}`}>{fx.kind==="heal"?"+":fx.kind==="shield"?"✦":"✹"}</span>:null}</div><div className="combat-hud-panel"><h3>{fighter.name}</h3><p>{character.raceName} · {character.className}{own?" · VOCÊ":""}</p><CombatStatusDock fighter={fighter}/><Meter label="HP" value={fighter.hp} max={fighter.maxHp} kind="hp" /><ResourceStack fighter={fighter}/></div></article>}
function MonsterCard({fighter,name,subtitle,imageUrl,active,fx}:{fighter:CombatantState;name:string;subtitle:string;imageUrl:string;active:boolean;fx:Fx}){return <article className={`pvp-fighter jrpg-fighter ${active?"is-active":""} ${fx?`fx-${fx.kind}`:""}`}><div className="combat-identity-frame"><div className="jrpg-fighter__portrait monster-art" style={{backgroundImage:`url(${imageUrl})`}}/>{fx?<span key={fx.token} className={`combat-fx combat-fx--${fx.kind}`}>{fx.kind==="heal"?"+":fx.kind==="shield"?"✦":"✹"}</span>:null}</div><div className="combat-hud-panel"><h3>{name}</h3><p>{subtitle}</p><CombatStatusDock fighter={fighter}/><Meter label="HP" value={fighter.hp} max={fighter.maxHp} kind="hp" /><ResourceStack fighter={fighter}/></div></article>}
function ResourceStack({fighter}:{fighter:CombatantState}){return <div className="combat-resource-stack">{fighter.maxMana>0?<Meter label="Mana" value={fighter.mana} max={fighter.maxMana} kind="mana"/>:null}{fighter.maxClassResource>0?<Meter label={fighter.classResourceName} value={fighter.classResource} max={fighter.maxClassResource} kind="class"/>:null}{fighter.maxRaceResource>0?<Meter label={fighter.raceResourceName} value={fighter.raceResource} max={fighter.maxRaceResource} kind="race"/>:null}{fighter.shield>0?<Meter label="Escudo" value={fighter.shield} max={Math.max(fighter.maxHp,fighter.shield)} kind="shield"/>:null}</div>}
function Meter({label,value,max,kind}:{label:string;value:number;max:number;kind:"hp"|"mana"|"class"|"race"|"shield"}){return <div className={`combat-meter combat-meter--${kind}`}><span><b>{label}</b><strong>{value.toLocaleString("pt-BR")} / {max.toLocaleString("pt-BR")}</strong></span><progress max={Math.max(1,max)} value={Math.max(0,value)}/></div>}
function Command({name,detail,disabled,used=false,onClick}:{name:string;detail:string;disabled:boolean;used?:boolean;onClick():void}){return <button className={`arena-action-card jrpg-action ${used?"is-used":""}`} disabled={disabled} onClick={onClick} type="button"><strong>{name}</strong><small>{detail}</small></button>}
