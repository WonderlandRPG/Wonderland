"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { CharacterPortraitCard } from "@/components/characters/character-portrait-card";
import { CombatSkillCard } from "@/components/arena/combat-skill-card";
import { CombatStatusDock } from "@/components/arena/combat-status-dock";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { defaultCombatRules, type CombatantState } from "@/lib/game/combat";
import { createTurnActionUsage, isSilenced, isTurnBlocked } from "@/lib/game/turn-engine";
import type { ArenaCharacter } from "@/lib/game/arena-types";
import type { PvpDuoBattleState } from "@/lib/game/pvp-duo-state";
import { getPvpDuoMatchStateAction, performPvpDuoAction } from "@/app/arena/pvp-duo/[matchId]/actions";

type DuoRoom = {
  matchId: string;
  version: number;
  format: "duo";
  ownCharacterId: string;
  opponentCharacterId: string;
  ownCharacterIds: string[];
  opponentCharacterIds: string[];
  controllableCharacterIds: string[];
  state: PvpDuoBattleState;
};

type Member = { team: number; slot: number; character: ArenaCharacter };
type Fx = { id: string; kind: "damage" | "heal" | "shield"; token: number } | null;

export function PvpDuoBattle({
  matchId,
  initialRoom,
  members,
  ownTeam,
}: {
  matchId: string;
  initialRoom: DuoRoom;
  members: Member[];
  ownTeam: number;
}) {
  const [room, setRoom] = useState(initialRoom);
  const [panel, setPanel] = useState<"root" | "class" | "race" | "item">("root");
  const [selectedTargetId, setSelectedTargetId] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [clock, setClock] = useState(() => Date.now());
  const [fx, setFx] = useState<Fx>(null);
  const state = room.state;
  const meta = useMemo(
    () => Object.fromEntries(members.map((member) => [member.character.id, member.character])),
    [members],
  );
  const ownIds = room.ownCharacterIds.filter(Boolean);
  const enemyIds = room.opponentCharacterIds.filter(Boolean);
  const controllableIds = room.controllableCharacterIds.filter(Boolean);
  const activeId = state.activeCharacterId;
  const activeCharacter = meta[activeId];
  const activeFighter = state.fighters[activeId];
  const isMyTurn = state.status === "active" && controllableIds.includes(activeId);
  const usage = state.turnActions ?? createTurnActionUsage();
  const seconds = Math.max(0, Math.ceil((Date.parse(state.turnEndsAt) - clock) / 1000));
  const finished = state.status !== "active";
  const livingTargets = [...ownIds, ...enemyIds].filter((id) => (state.fighters[id]?.hp ?? 0) > 0);
  const chosenTargetId =
    selectedTargetId && livingTargets.includes(selectedTargetId)
      ? selectedTargetId
      : (enemyIds.find((id) => (state.fighters[id]?.hp ?? 0) > 0) ?? activeId);
  const chosenTarget = state.fighters[chosenTargetId] ?? activeFighter;
  const previousHp = useRef<Record<string, { hp: number; shield: number }>>(
    Object.fromEntries(
      Object.values(state.fighters).map((fighter) => [
        fighter.id,
        { hp: fighter.hp, shield: fighter.shield },
      ]),
    ),
  );

  const refresh = useCallback(async () => {
    const result = await getPvpDuoMatchStateAction(matchId);
    if (result.ok)
      setRoom((current) => (result.data.version > current.version ? result.data : current));
    else setError(result.message);
  }, [matchId]);

  useEffect(() => {
    const client = createBrowserSupabaseClient();
    const channel = client
      ?.channel(`pvp-duo:${matchId}`)
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
    const old = previousHp.current;
    for (const fighter of Object.values(state.fighters)) {
      const before = old[fighter.id];
      if (!before) continue;
      if (fighter.hp < before.hp) {
        setFx({ id: fighter.id, kind: "damage", token: Date.now() });
        break;
      }
      if (fighter.hp > before.hp) {
        setFx({ id: fighter.id, kind: "heal", token: Date.now() });
        break;
      }
      if (fighter.shield > before.shield) {
        setFx({ id: fighter.id, kind: "shield", token: Date.now() });
        break;
      }
    }
    previousHp.current = Object.fromEntries(
      Object.values(state.fighters).map((fighter) => [fighter.id, { hp: fighter.hp, shield: fighter.shield }]),
    );
  }, [room.version, state.fighters]);

  useEffect(() => {
    if (seconds !== 0 || !isMyTurn || pending || finished) return;
    void submit({ kind: "end" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds, isMyTurn, room.version, finished]);

  function submit(action: Record<string, unknown>) {
    if (!isMyTurn || pending || finished) return;
    setError("");
    startTransition(async () => {
      const result = await performPvpDuoAction(matchId, room.version, action);
      if (result.data) setRoom(result.data);
      if (!result.ok) setError(result.message);
      else setPanel("root");
    });
  }

  const activeBlocked = activeFighter ? isTurnBlocked(activeFighter) : false;
  const silenced = activeFighter ? isSilenced(activeFighter) : false;
  const winnerTeam = state.winnerCharacterId
    ? members.find((member) => member.character.id === state.winnerCharacterId)?.team
    : null;

  return (
    <section className="arena-console jrpg-battle pvp-duo-battle">
      <header className="arena-toolbar arena-game-header">
        <div>
          <span className="eyebrow">PvP · Duplas 2 × 2</span>
          <h1>Confronto de equipes</h1>
          <p>Cada jogador real controla apenas o próprio personagem. INI organiza os quatro turnos.</p>
        </div>
        <strong className={`arena-turn-timer ${seconds <= 10 ? "is-ending" : ""}`}>
          <small>Tempo</small>{String(seconds).padStart(2, "0")}s
        </strong>
        <strong className="arena-turn-counter"><small>Rodada</small>{String(state.round).padStart(2, "0")}</strong>
      </header>

      <div className="jrpg-turn-order">
        {state.turnOrder.filter((id) => (state.fighters[id]?.hp ?? 0) > 0).map((id, index) => (
          <span className={activeId === id ? "is-active" : ""} key={id}>{index + 1}. {state.fighters[id]?.name}</span>
        ))}
      </div>

      {isMyTurn ? <div className="turn-action-economy"><ActionSlot label="Ataque" used={usage.basic} /><ActionSlot label="Classe" used={usage.class} /><ActionSlot label="Raça" used={usage.race} /></div> : null}

      <div className="jrpg-stage jrpg-duo-stage combat-stage-pvp">
        <div className="duo-team duo-team--enemy">
          {enemyIds.map((id) => <DuoFighter key={id} fighter={state.fighters[id]} character={meta[id]} active={activeId === id} fx={fx?.id === id ? fx : null} />)}
        </div>
        <span className="pvp-versus">VS<small>2x2</small></span>
        <div className="duo-team duo-team--own">
          {ownIds.map((id) => <DuoFighter key={id} fighter={state.fighters[id]} character={meta[id]} active={activeId === id} controlled={controllableIds.includes(id)} fx={fx?.id === id ? fx : null} />)}
        </div>
      </div>

      <p className="arena-message" role="status"><span>Combate</span>{state.message}</p>
      {error ? <p className="arena-result__error">{error}</p> : null}

      {!finished && activeCharacter && activeFighter ? (
        <section className="arena-command-panel jrpg-command-panel">
          <header>
            <div><span className="eyebrow">Comandos · {activeCharacter.name}</span><h2>{isMyTurn ? activeBlocked ? "Turno incapacitado" : "Monte sua sequência" : `Turno de ${state.fighters[activeId]?.name}`}</h2></div>
            <small>{isMyTurn ? silenced ? "Silenciado: habilidades bloqueadas." : "Selecione aliado ou inimigo conforme a habilidade." : controllableIds.length ? "Aguardando o turno do seu personagem." : "Você está assistindo esta equipe."}</small>
          </header>

          {isMyTurn ? <label className="combat-target-select"><span>Alvo da habilidade</span><select value={chosenTargetId} onChange={(event) => setSelectedTargetId(event.target.value)}>{livingTargets.map((id) => <option key={id} value={id}>{ownIds.includes(id) ? "Aliado" : "Inimigo"} · {state.fighters[id]?.name}</option>)}</select></label> : null}

          {panel === "root" ? (
            <div className="pvp-actions-grid jrpg-actions">
              <Command used={usage.basic} disabled={!isMyTurn || pending || activeBlocked || usage.basic} name="Atacar" detail={usage.basic ? "Já usado" : "Ataque básico"} onClick={() => submit({ kind: "basic" })} />
              <Command used={usage.class} disabled={!isMyTurn || pending || activeBlocked || silenced || usage.class || activeCharacter.skills.length === 0} name="Habilidades" detail={`${activeCharacter.skills.length} de classe`} onClick={() => setPanel("class")} />
              <Command used={usage.race} disabled={!isMyTurn || pending || activeBlocked || silenced || usage.race || activeCharacter.raceAbilities.length === 0} name="Raça" detail={`${activeCharacter.raceAbilities.length} racial(is)`} onClick={() => setPanel("race")} />
              <Command disabled={!isMyTurn || pending || activeBlocked || activeCharacter.items.length === 0} name="Item" detail={`${activeCharacter.items.length} disponível(is) · encerra turno`} onClick={() => setPanel("item")} />
              <Command disabled={!isMyTurn || pending || activeBlocked} name="Encerrar turno" detail="Finaliza a sequência" onClick={() => submit({ kind: "end" })} />
            </div>
          ) : (
            <div className="jrpg-submenu combat-skill-list">
              <button className="button button--ghost" type="button" onClick={() => setPanel("root")}>← Voltar</button>
              {panel === "class" ? activeCharacter.skills.map((skill) => <CombatSkillCard key={skill.key} fighter={activeFighter} target={skill.target === "self" ? activeFighter : chosenTarget} rules={defaultCombatRules} skill={skill} disabled={!isMyTurn || pending || activeBlocked || silenced} used={usage.class} onClick={() => submit({ kind: "class", key: skill.key, targetId: chosenTargetId })} />) : null}
              {panel === "race" ? activeCharacter.raceAbilities.map((skill) => <CombatSkillCard key={skill.key} fighter={activeFighter} target={skill.target === "self" ? activeFighter : chosenTarget} rules={defaultCombatRules} skill={skill} disabled={!isMyTurn || pending || activeBlocked || silenced} used={usage.race} onClick={() => submit({ kind: "race", key: skill.key, targetId: chosenTargetId })} />) : null}
              {panel === "item" ? activeCharacter.items.map((item) => <Command key={item.id} disabled={!isMyTurn || pending || activeBlocked} name={item.name} detail={`${item.description || "Usar item"} · encerra turno`} onClick={() => submit({ kind: "item", id: item.id })} />) : null}
            </div>
          )}
        </section>
      ) : null}

      {finished ? <section className="arena-result"><span>{winnerTeam === ownTeam ? "VITÓRIA" : "DERROTA"}</span><h2>{winnerTeam === ownTeam ? "Sua dupla venceu o confronto." : state.winnerCharacterId ? "A dupla adversária venceu." : "A partida terminou em derrota por desistência."}</h2></section> : null}
    </section>
  );
}

function DuoFighter({ fighter, character, active, controlled = false, fx }: { fighter?: CombatantState; character?: ArenaCharacter; active: boolean; controlled?: boolean; fx: Fx }) {
  if (!fighter || !character) return null;
  return (
    <article className={`pvp-fighter jrpg-fighter duo-fighter ${active ? "is-active" : ""} ${controlled ? "is-controlled" : ""} ${fighter.hp <= 0 ? "is-down" : ""} ${fx ? `fx-${fx.kind}` : ""}`}>
      <div className="combat-hp-float"><span>HP <b>{fighter.hp.toLocaleString("pt-BR")} / {fighter.maxHp.toLocaleString("pt-BR")}</b></span><progress max={fighter.maxHp} value={fighter.hp} /></div>
      <div className="combat-identity-frame">
        <CharacterPortraitCard name={character.name} imageUrl={character.imageUrl || null} rank={character.adventureRank} level={character.level} title={character.equippedTitle} variant="compact" className="combat-official-character-card" />
        {controlled ? <span className="duo-control-badge">SEU PERSONAGEM</span> : null}
        {fx ? <span key={fx.token} className={`combat-fx combat-fx--${fx.kind}`}>{fx.kind === "heal" ? "+" : fx.kind === "shield" ? "✦" : "✹"}</span> : null}
      </div>
      <div className="combat-hud-panel"><h3>{character.name}</h3><p>{character.raceName} · {character.className}</p><CombatStatusDock fighter={fighter} /></div>
    </article>
  );
}

function ActionSlot({ label, used }: { label: string; used: boolean }) { return <span className={used ? "is-used" : ""}><i>{used ? "✓" : "•"}</i>{label}<small>{used ? "usado" : "disponível"}</small></span>; }
function Command({ name, detail, disabled, used = false, onClick }: { name: string; detail: string; disabled: boolean; used?: boolean; onClick(): void }) { return <button className={`arena-action-card jrpg-action ${used ? "is-used" : ""}`} disabled={disabled} onClick={onClick} type="button"><strong>{name}</strong><small>{detail}</small></button>; }
