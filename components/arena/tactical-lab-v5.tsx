"use client";

import { useMemo, useState } from "react";

import styles from "@/app/arena/mapa-tatico/tactical-lab.module.css";
import {
  createCombatant,
  resolveBasicAttack,
  tickCooldowns,
  type CombatAttributes,
  type CombatantState,
} from "@/lib/game/combat";
import type { ClassSkill } from "@/lib/game/classes";
import {
  chooseCreatureTacticalSkill,
  getCreaturePlanningSkillRange,
} from "@/lib/game/creature-tactical-ai";
import {
  applyCreatureBasicAttackResistance,
  applyCreatureControlResistances,
  applyCreatureDamageTraits,
  createDefaultCreatureSkill,
  type TacticalBestiaryCreature,
} from "@/lib/game/creature-tactical-combat";
import {
  getTacticalFearTurns,
  getTacticalRootTurns,
  getTacticalSilenceTurns,
  getTacticalStunTurns,
  getTacticalTaunt,
} from "@/lib/game/tactical-control";
import { chooseTacticalFleeDestination } from "@/lib/game/tactical-fear";
import { chooseTacticalProfileDestination } from "@/lib/game/tactical-ai-profiles";
import {
  getForcedMovementDestination,
  getReachableTacticalCells,
  getTacticalAreaCells,
  getTacticalDistance,
  hasTacticalLineOfSight,
  tacticalPositionKey,
  type TacticalPosition,
} from "@/lib/game/tactical-grid";
import { resolveTacticalSkill } from "@/lib/game/tactical-skill";

type SkillSource = "class" | "race";
type TacticalItem = { id: string; name: string; description: string };
type TacticalCharacter = {
  id: string;
  name: string;
  level: number;
  rank: string;
  raceName: string;
  className: string;
  baseHp: number;
  baseMana: number;
  attributes: CombatAttributes;
  classResource: {
    name: string;
    initial: number;
    maximum: number;
    generationEvents?: Array<{ trigger: string; amount: number }>;
  };
  raceResource: {
    name: string;
    initial: number;
    maximum: number;
    generationEvents?: Array<{ trigger: string; amount: number }>;
  } | null;
  usesMana: boolean;
  basicAttackRange: number;
  basicAttackDamageType: "physical" | "magic";
  skills: Array<{ source: SkillSource; skill: ClassSkill }>;
  items: TacticalItem[];
};

type PlayerAction =
  | { kind: "basic"; name: string; range: number; area: 0 }
  | {
      kind: "skill";
      name: string;
      range: number;
      area: number;
      source: SkillSource;
      skill: ClassSkill;
    };

const GRID = { width: 10, height: 8 } as const;
const PLAYER_MOVE = 4;
const START_PLAYER: TacticalPosition = { x: 2, y: 5 };
const START_ENEMY: TacticalPosition = { x: 7, y: 2 };
const obstacles = new Set(["4,1", "4,2", "4,3", "5,3", "6,3", "2,2", "7,5", "7,6"]);

function makePlayer(character: TacticalCharacter) {
  return createCombatant({
    id: character.id,
    name: character.name,
    attributes: character.attributes,
    baseHp: character.baseHp,
    baseMana: character.baseMana,
    classResource: character.classResource,
    raceResource: character.raceResource,
    usesMana: character.usesMana,
    basicAttackDamageType: character.basicAttackDamageType,
  });
}

function makeCreature(creature: TacticalBestiaryCreature) {
  return createCombatant({
    id: creature.id,
    name: creature.name,
    attributes: creature.combatProfile.attributes,
    baseHp: creature.combatProfile.hp,
    baseMana: 0,
    usesMana: false,
    basicAttackDamageType: creature.combatProfile.basicAttackDamageType,
  });
}

function percent(current: number, maximum: number) {
  return maximum <= 0 ? 0 : Math.max(0, Math.min(100, (current / maximum) * 100));
}

function affectsEnemy(skill: ClassSkill) {
  return skill.operations.some(
    (operation) => operation.target === "enemy" || operation.target === "area",
  );
}

export function TacticalLabV5({
  characters,
  creatures,
}: {
  characters: TacticalCharacter[];
  creatures: TacticalBestiaryCreature[];
}) {
  const firstCharacter = characters[0];
  const firstCreature =
    creatures.find((creature) => creature.rank === firstCharacter?.rank) ?? creatures[0];
  const [characterId, setCharacterId] = useState(firstCharacter?.id ?? "");
  const [creatureId, setCreatureId] = useState(firstCreature?.id ?? "");
  const character = characters.find((entry) => entry.id === characterId) ?? firstCharacter;
  const creature = creatures.find((entry) => entry.id === creatureId) ?? firstCreature;
  const [playerPosition, setPlayerPosition] = useState<TacticalPosition>(START_PLAYER);
  const [enemyPosition, setEnemyPosition] = useState<TacticalPosition>(START_ENEMY);
  const [playerState, setPlayerState] = useState<CombatantState | null>(() =>
    firstCharacter ? makePlayer(firstCharacter) : null,
  );
  const [enemyState, setEnemyState] = useState<CombatantState | null>(() =>
    firstCreature ? makeCreature(firstCreature) : null,
  );
  const [movement, setMovement] = useState(PLAYER_MOVE);
  const [action, setAction] = useState<PlayerAction | null>(null);
  const [areaCenter, setAreaCenter] = useState<TacticalPosition | null>(null);
  const [usedBasic, setUsedBasic] = useState(false);
  const [usedClass, setUsedClass] = useState(false);
  const [usedRace, setUsedRace] = useState(false);
  const [usedItem, setUsedItem] = useState(false);
  const [round, setRound] = useState(1);
  const [message, setMessage] = useState("V5 pronta: criatura real do Bestiário carregada.");
  const [log, setLog] = useState<string[]>([
    "V5: Bestiário real + perfis de combate + fraquezas + resistências + controles.",
  ]);

  const reachable = useMemo(
    () =>
      getReachableTacticalCells({
        start: playerPosition,
        blocked: new Set([...obstacles, tacticalPositionKey(enemyPosition)]),
        movement,
        grid: GRID,
      }),
    [playerPosition, enemyPosition, movement],
  );
  const areaCells = useMemo(
    () =>
      action && areaCenter
        ? getTacticalAreaCells({ center: areaCenter, radius: action.area, grid: GRID })
        : new Set<string>(),
    [action, areaCenter],
  );
  const cells = useMemo(
    () =>
      Array.from({ length: GRID.width * GRID.height }, (_, index) => ({
        x: index % GRID.width,
        y: Math.floor(index / GRID.width),
      })),
    [],
  );

  if (!character || !creature || !playerState || !enemyState) {
    return (
      <section className={styles.empty}>
        É necessário ter personagem e criatura disponíveis para o laboratório.
      </section>
    );
  }

  const player = playerState;
  const enemy = enemyState;
  const profile = creature.combatProfile;
  const creatureSkills = profile.skills.length
    ? profile.skills
    : [createDefaultCreatureSkill(creature)];

  const playerRoot = getTacticalRootTurns(player);
  const enemyRoot = getTacticalRootTurns(enemy);
  const playerStun = getTacticalStunTurns(player);
  const enemyStun = getTacticalStunTurns(enemy);
  const playerSilence = getTacticalSilenceTurns(player);
  const enemySilence = getTacticalSilenceTurns(enemy);
  const playerFear = getTacticalFearTurns(player);
  const enemyFear = getTacticalFearTurns(enemy);
  const playerTaunt = getTacticalTaunt(player);
  const enemyTaunt = getTacticalTaunt(enemy);
  const finished = player.hp <= 0 || enemy.hp <= 0;
  const rankMismatch = character.rank !== creature.rank;

  function addLog(text: string) {
    setLog((current) => [text, ...current].slice(0, 16));
  }

  function sourceUsed(source: SkillSource) {
    return source === "class" ? usedClass : usedRace;
  }

  function clearAction() {
    setAction(null);
    setAreaCenter(null);
  }

  function resetTurnActions() {
    setMovement(PLAYER_MOVE);
    setUsedBasic(false);
    setUsedClass(false);
    setUsedRace(false);
    setUsedItem(false);
    clearAction();
  }

  function resetBoard(nextCharacter = character, nextCreature = creature) {
    setPlayerPosition(START_PLAYER);
    setEnemyPosition(START_ENEMY);
    setPlayerState(makePlayer(nextCharacter));
    setEnemyState(makeCreature(nextCreature));
    resetTurnActions();
    setRound(1);
    setLog([`V5 reiniciada: ${nextCharacter.name} vs ${nextCreature.name}.`]);
    setMessage("Mapa reiniciado.");
  }

  function changeCharacter(id: string) {
    const next = characters.find((entry) => entry.id === id);
    if (!next) return;
    const sameRankCreature = creatures.find((entry) => entry.rank === next.rank) ?? creature;
    setCharacterId(id);
    setCreatureId(sameRankCreature.id);
    resetBoard(next, sameRankCreature);
  }

  function changeCreature(id: string) {
    const next = creatures.find((entry) => entry.id === id);
    if (!next) return;
    setCreatureId(id);
    resetBoard(character, next);
  }

  function selectAction(next: PlayerAction) {
    if (finished) return setMessage("O combate terminou. Reinicie o mapa.");
    if (playerStun > 0) {
      return setMessage(`Você está atordoado por ${playerStun} turno(s) e não pode agir.`);
    }
    if (next.kind === "basic") {
      if (playerFear > 0) {
        return setMessage(`Você está com medo por ${playerFear} turno(s) e não pode usar ações ofensivas.`);
      }
      if (usedBasic) return setMessage("Ataque Básico já usado neste turno.");
    }
    if (next.kind === "skill") {
      if (playerSilence > 0) {
        return setMessage(`Você está silenciado por ${playerSilence} turno(s) e não pode usar habilidades.`);
      }
      if (playerFear > 0 && affectsEnemy(next.skill)) {
        return setMessage(`Você está com medo por ${playerFear} turno(s) e não pode usar habilidades ofensivas.`);
      }
      if (sourceUsed(next.source)) {
        return setMessage(
          `Habilidade de ${next.source === "class" ? "Classe" : "Raça"} já usada neste turno.`,
        );
      }
      const cooldown = player.cooldowns[next.skill.key] ?? 0;
      if (cooldown > 0) return setMessage(`${next.name} está em cooldown por ${cooldown} turno(s).`);
    }
    setAction(next);
    setAreaCenter(null);
    setMessage(`${next.name} selecionado.`);
  }

  function executePlayerSkill(
    selected: Extract<PlayerAction, { kind: "skill" }>,
    center: TacticalPosition,
  ) {
    if (playerStun > 0) {
      return setMessage(`Você está atordoado por ${playerStun} turno(s) e não pode agir.`);
    }
    if (playerSilence > 0) {
      return setMessage(`Você está silenciado por ${playerSilence} turno(s) e não pode usar habilidades.`);
    }
    if (playerFear > 0 && affectsEnemy(selected.skill)) {
      return setMessage(`Você está com medo por ${playerFear} turno(s) e não pode usar habilidades ofensivas.`);
    }
    if (selected.area > 0 && affectsEnemy(selected.skill)) {
      const affected = getTacticalAreaCells({ center, radius: selected.area, grid: GRID });
      if (!affected.has(tacticalPositionKey(enemyPosition))) {
        return setMessage(`A área não atingiu ${creature.name}.`);
      }
    }

    const beforeEnemy = enemy;
    const result = resolveTacticalSkill(player, enemy, selected.skill);
    if (result.event.kind === "error") return setMessage(result.event.message);

    const controlResult = applyCreatureControlResistances({
      before: beforeEnemy,
      after: result.target,
      skill: selected.skill,
      resistances: profile.resistances,
    });
    const damageTraits = applyCreatureDamageTraits({
      before: beforeEnemy,
      after: controlResult.target,
      skill: selected.skill,
      weaknesses: creature.weaknesses,
      resistances: profile.resistances,
    });
    const nextEnemyState = damageTraits.target;
    let nextPlayerPosition = playerPosition;
    let nextEnemyPosition = enemyPosition;
    const spatial: string[] = [];

    for (const operation of selected.skill.operations) {
      const distance = Math.max(1, operation.distance || 1);
      if (
        operation.operation === "PUSH" &&
        (operation.target === "enemy" || operation.target === "area")
      ) {
        const forced = getForcedMovementDestination({
          source: nextPlayerPosition,
          target: nextEnemyPosition,
          distance,
          blocked: new Set([...obstacles, tacticalPositionKey(nextPlayerPosition)]),
          grid: GRID,
        });
        nextEnemyPosition = forced.position;
        spatial.push(forced.moved ? `Push: ${forced.moved} casa(s).` : "Push bloqueado.");
      }
      if (
        (operation.operation === "MOVE" || operation.operation === "TELEPORT") &&
        (operation.target === "self" || operation.target === "source")
      ) {
        const destinationKey = tacticalPositionKey(center);
        if (
          !obstacles.has(destinationKey) &&
          destinationKey !== tacticalPositionKey(nextEnemyPosition) &&
          getTacticalDistance(playerPosition, center) <= distance
        ) {
          nextPlayerPosition = center;
          spatial.push(`${operation.operation}: casa ${center.x + 1},${center.y + 1}.`);
        }
      }
    }

    setPlayerState(result.actor);
    setEnemyState(nextEnemyState);
    setPlayerPosition(nextPlayerPosition);
    setEnemyPosition(nextEnemyPosition);
    if (selected.source === "class") setUsedClass(true);
    else setUsedRace(true);

    const traitText = damageTraits.neutralized
      ? ` FRAQUEZA/RESISTÊNCIA ANULADAS (${damageTraits.weakness} × ${damageTraits.resistance}).`
      : `${damageTraits.weakness ? ` FRAQUEZA ATIVADA (${damageTraits.weakness}): +${damageTraits.bonusDamage} de dano (+25%).` : ""}${damageTraits.resistance ? ` RESISTÊNCIA ATIVADA (${damageTraits.resistance}): -${damageTraits.reducedDamage} de dano (-25%).` : ""}`;
    const controlText = controlResult.resisted.length
      ? ` ${controlResult.resisted
          .map((entry) =>
            entry.reducedTurns > 0
              ? `RESISTÊNCIA A ${entry.operation} (${entry.resistance}): -${entry.reducedTurns} turno.`
              : `RESISTÊNCIA A ${entry.operation} (${entry.resistance}).`,
          )
          .join(" ")}`
      : "";
    const text = `${result.event.message}${traitText}${controlText}${spatial.length ? ` ${spatial.join(" ")}` : ""}`;
    setMessage(text);
    addLog(text);
    clearAction();
  }

  function clickCell(position: TacticalPosition) {
    const key = tacticalPositionKey(position);
    if (!action) {
      if (playerStun > 0) {
        return setMessage(`Você está atordoado por ${playerStun} turno(s) e não pode agir.`);
      }
      if (playerRoot > 0) return setMessage(`Você está imobilizado por ${playerRoot} turno(s).`);
      if (!reachable.has(key)) return;
      const cost = reachable.get(key) ?? 0;
      setPlayerPosition(position);
      setMovement((current) => Math.max(0, current - cost));
      setMessage(`Movimento: ${cost} ponto(s) consumido(s).`);
      return;
    }

    if (playerStun > 0) {
      return setMessage(`Você está atordoado por ${playerStun} turno(s) e não pode agir.`);
    }
    if (obstacles.has(key)) return setMessage("Essa casa está bloqueada.");
    const distance = getTacticalDistance(playerPosition, position);
    if (distance > action.range) {
      return setMessage(`${action.name}: fora do alcance (${distance}/${action.range}).`);
    }

    if (action.kind === "basic") {
      if (playerFear > 0) {
        return setMessage(`Você está com medo por ${playerFear} turno(s) e não pode atacar.`);
      }
      if (key !== tacticalPositionKey(enemyPosition)) return setMessage(`Selecione ${creature.name}.`);
      if (
        !hasTacticalLineOfSight({ from: playerPosition, to: enemyPosition, blocked: obstacles })
      ) {
        return setMessage("Linha de visão bloqueada.");
      }
      const result = resolveBasicAttack(player, enemy);
      const resistanceResult = applyCreatureBasicAttackResistance({
        before: enemy,
        after: result.target,
        damageType: character.basicAttackDamageType,
        resistances: profile.resistances,
      });
      const resistanceText = resistanceResult.resistance
        ? ` RESISTÊNCIA ATIVADA (${resistanceResult.resistance}): -${resistanceResult.reducedDamage} de dano (-25%).`
        : "";
      const text = `${result.event.message}${resistanceText}`;
      setPlayerState(result.actor);
      setEnemyState(resistanceResult.target);
      setUsedBasic(true);
      setMessage(text);
      addLog(text);
      clearAction();
      return;
    }

    const targetsEnemy = affectsEnemy(action.skill);
    if (playerSilence > 0) {
      return setMessage(`Você está silenciado por ${playerSilence} turno(s) e não pode usar habilidades.`);
    }
    if (playerFear > 0 && targetsEnemy) {
      return setMessage(`Você está com medo por ${playerFear} turno(s) e não pode usar habilidades ofensivas.`);
    }
    if (targetsEnemy && action.area <= 0 && key !== tacticalPositionKey(enemyPosition)) {
      return setMessage(`Selecione ${creature.name}.`);
    }
    if (
      targetsEnemy &&
      !hasTacticalLineOfSight({ from: playerPosition, to: position, blocked: obstacles })
    ) {
      return setMessage(`${action.name}: linha de visão bloqueada.`);
    }
    executePlayerSkill(action, position);
  }

  function useItem(item: TacticalItem) {
    if (usedItem || finished) return;
    if (playerStun > 0) {
      return setMessage(`Você está atordoado por ${playerStun} turno(s) e não pode usar itens.`);
    }
    const healed = Math.min(
      Math.max(25, Math.round(player.maxHp * 0.25)),
      player.maxHp - player.hp,
    );
    setPlayerState({ ...player, hp: player.hp + healed });
    setUsedItem(true);
    const text = `${player.name} usou ${item.name} e recuperou ${healed} HP. Item real preservado.`;
    setMessage(text);
    addLog(text);
  }

  function executeEnemyTurn() {
    if (finished) return;

    let nextEnemy = enemy;
    let nextPlayer = tickCooldowns(player);
    let nextEnemyPosition = enemyPosition;
    let nextPlayerPosition = playerPosition;
    const notes = [`Rodada ${round}: ${creature.name} (${profile.aiProfile}).`];

    if (playerStun > 0) notes.push(`${player.name} encerrou o turno atordoado.`);
    if (playerSilence > 0) notes.push(`${player.name} encerrou o turno silenciado.`);
    if (playerFear > 0) notes.push(`${player.name} encerrou o turno sob medo.`);
    if (playerTaunt) notes.push(`${player.name} está provocado por ${playerTaunt.turns} turno(s).`);

    if (enemyStun > 0) {
      notes.push(`${creature.name} está atordoado por ${enemyStun} turno(s) e perdeu a ação.`);
    } else if (enemyFear > 0) {
      if (enemyRoot > 0) {
        notes.push(`${creature.name} está com medo, mas ROOT impede a fuga.`);
      } else {
        const flee = chooseTacticalFleeDestination({
          start: enemyPosition,
          threat: playerPosition,
          movement: profile.movement,
          grid: GRID,
          blocked: obstacles,
        });
        nextEnemyPosition = flee.position;
        notes.push(
          flee.movementCost > 0
            ? `${creature.name} fugiu ${flee.movementCost} casa(s) por FEAR.`
            : `${creature.name} não encontrou rota de fuga por FEAR.`,
        );
      }
      notes.push(`${creature.name} não pode executar ações ofensivas enquanto estiver com FEAR.`);
    } else {
      const planningRange = getCreaturePlanningSkillRange({
        skills: creatureSkills,
        cooldowns: nextEnemy.cooldowns,
        profile: profile.aiProfile,
        fallbackRange: profile.basicAttackRange,
      });
      const hasReadySkill =
        enemySilence <= 0 &&
        creatureSkills.some((skill) => (nextEnemy.cooldowns[skill.key] ?? 0) <= 0);

      if (enemyRoot > 0) {
        notes.push(`Imobilizado por ${enemyRoot} turno(s): não pode se mover.`);
      } else {
        const decision = chooseTacticalProfileDestination({
          profile: profile.aiProfile,
          start: enemyPosition,
          target: playerPosition,
          movement: profile.movement,
          grid: GRID,
          blocked: obstacles,
          sightBlocked: obstacles,
          basicRange: profile.basicAttackRange,
          skillRange: planningRange,
          skillAvailable: hasReadySkill,
        });
        nextEnemyPosition = decision.position;
        notes.push(
          decision.movementCost > 0
            ? `Moveu ${decision.movementCost} casa(s): ${decision.reason}.`
            : `Manteve posição: ${decision.reason}.`,
        );
      }

      const distance = getTacticalDistance(nextEnemyPosition, nextPlayerPosition);
      const sight = hasTacticalLineOfSight({
        from: nextEnemyPosition,
        to: nextPlayerPosition,
        blocked: obstacles,
      });
      const selectedEnemySkill =
        sight && enemySilence <= 0
          ? chooseCreatureTacticalSkill({
              skills: creatureSkills,
              cooldowns: nextEnemy.cooldowns,
              distance,
              profile: profile.aiProfile,
            })
          : null;

      if (enemySilence > 0) {
        notes.push(`${creature.name} está silenciado: habilidades bloqueadas.`);
      }
      if (enemyTaunt) {
        notes.push(`TAUNT ativo: alvo obrigatório ${enemyTaunt.targetId} por ${enemyTaunt.turns} turno(s).`);
      }

      if (selectedEnemySkill) {
        notes.push(`IA escolheu ${selectedEnemySkill.name}.`);
        const result = resolveTacticalSkill(nextEnemy, nextPlayer, selectedEnemySkill);
        nextEnemy = result.actor;
        nextPlayer = result.target;
        notes.push(result.event.message);

        const push = selectedEnemySkill.operations.find(
          (operation) => operation.operation === "PUSH",
        );
        if (push) {
          const forced = getForcedMovementDestination({
            source: nextEnemyPosition,
            target: nextPlayerPosition,
            distance: Math.max(1, push.distance || 1),
            blocked: new Set([...obstacles, tacticalPositionKey(nextEnemyPosition)]),
            grid: GRID,
          });
          nextPlayerPosition = forced.position;
          if (forced.moved) notes.push(`Jogador empurrado ${forced.moved} casa(s).`);
        }
      } else if (distance <= profile.basicAttackRange && sight) {
        const result = resolveBasicAttack(nextEnemy, nextPlayer);
        nextEnemy = result.actor;
        nextPlayer = result.target;
        notes.push(
          enemySilence > 0
            ? "Silenciado, então a IA recorreu ao Ataque Básico."
            : "Nenhuma habilidade própria válida; IA usou Ataque Básico.",
        );
        notes.push(result.event.message);
      } else {
        notes.push(`Sem ação ofensiva válida. Distância ${distance}.`);
      }
    }

    nextEnemy = tickCooldowns(nextEnemy);
    setEnemyPosition(nextEnemyPosition);
    setPlayerPosition(nextPlayerPosition);
    setPlayerState(nextPlayer);
    setEnemyState(nextEnemy);
    resetTurnActions();
    setRound((value) => value + 1);
    notes.forEach(addLog);
    setMessage(
      nextPlayer.hp <= 0 ? `${nextPlayer.name} foi derrotado.` : `${notes.join(" ")} Seu turno.`,
    );
  }

  const playerSkillBlocked = playerStun > 0 || playerSilence > 0;
  const playerOffenseBlocked = playerStun > 0 || playerFear > 0;

  return (
    <section className={styles.lab} aria-label="Laboratório do mapa tático V5">
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Somente ADM · motor tático V5</span>
          <h1>Laboratório do Mapa Tático</h1>
          <p>
            Criaturas reais do Bestiário, múltiplas habilidades próprias, perfis de IA persistidos,
            fraquezas, resistências e controles táticos executados pelo mesmo motor.
          </p>
        </div>
        <div className={styles.status}>
          <small>Protótipo</small>
          <strong>V5 · Rodada {round}</strong>
        </div>
      </header>

      <section className={styles.characterPanel} data-wl-surface="raised">
        <label>
          <span>Personagem</span>
          <select value={character.id} onChange={(event) => changeCharacter(event.target.value)}>
            {characters.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name} · Rank {entry.rank} · {entry.className}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Criatura do Bestiário</span>
          <select value={creature.id} onChange={(event) => changeCreature(event.target.value)}>
            {creatures.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name} · Rank {entry.rank} · {entry.combatProfile.aiProfile}
              </option>
            ))}
          </select>
        </label>
        <div className={styles.characterSummary}>
          <strong>{character.name}</strong>
          <span>{character.raceName} · {character.className} · Rank {character.rank}</span>
          <span>
            {rankMismatch
              ? `TESTE FORA DO RANK: criatura Rank ${creature.rank}`
              : `Pareamento de Rank válido: ${creature.rank}`}
          </span>
        </div>
      </section>

      <section className={styles.combatHud}>
        <article>
          <small>AVENTUREIRO</small>
          <strong>{player.name}</strong>
          <div className={styles.bar}><i style={{ width: `${percent(player.hp, player.maxHp)}%` }} /></div>
          <span>HP {player.hp}/{player.maxHp}</span>
          {player.maxMana > 0 ? <span>Mana {player.mana}/{player.maxMana}</span> : null}
          {playerRoot > 0 ? <span>ROOT: {playerRoot}</span> : null}
          {playerStun > 0 ? <span>STUN: {playerStun}</span> : null}
          {playerSilence > 0 ? <span>SILENCE: {playerSilence}</span> : null}
          {playerFear > 0 ? <span>FEAR: {playerFear}</span> : null}
          {playerTaunt ? <span>TAUNT: {playerTaunt.turns}</span> : null}
        </article>
        <article data-enemy="true">
          <small>BESTIÁRIO · RANK {creature.rank}</small>
          <strong>{creature.name}</strong>
          <div className={styles.bar}><i style={{ width: `${percent(enemy.hp, enemy.maxHp)}%` }} /></div>
          <span>HP {enemy.hp}/{enemy.maxHp}</span>
          <span>IA {profile.aiProfile} · Movimento {profile.movement} · Alcance básico {profile.basicAttackRange}</span>
          <span>Fraquezas: {creature.weaknesses.length ? creature.weaknesses.join(" · ") : "nenhuma catalogada"}</span>
          <span>Resistências: {profile.resistances.length ? profile.resistances.join(" · ") : "nenhuma configurada"}</span>
          {enemyRoot > 0 ? <span>ROOT: {enemyRoot}</span> : null}
          {enemyStun > 0 ? <span>STUN: {enemyStun}</span> : null}
          {enemySilence > 0 ? <span>SILENCE: {enemySilence}</span> : null}
          {enemyFear > 0 ? <span>FEAR: {enemyFear}</span> : null}
          {enemyTaunt ? <span>TAUNT: {enemyTaunt.turns}</span> : null}
        </article>
      </section>

      <div className={styles.toolbar} data-wl-surface="raised">
        <button
          type="button"
          disabled={playerRoot > 0 || playerStun > 0 || finished}
          onClick={() => { clearAction(); setMessage(`Movimento: ${movement}/${PLAYER_MOVE}.`); }}
        >
          Movimento · {movement}/{PLAYER_MOVE}
        </button>
        <button
          type="button"
          disabled={usedBasic || playerOffenseBlocked || finished}
          data-wl-action={action?.kind === "basic" ? "primary" : undefined}
          onClick={() => selectAction({ kind: "basic", name: "Ataque Básico", range: character.basicAttackRange, area: 0 })}
        >
          Ataque · {usedBasic ? "USADO" : playerFear > 0 ? "BLOQUEADO POR FEAR" : "DISPONÍVEL"}
        </button>
        <button type="button" disabled={finished} onClick={executeEnemyTurn}>Encerrar turno → IA</button>
        <button type="button" onClick={() => resetBoard()}>Reiniciar</button>
      </div>

      <div className={styles.skillBar} data-wl-surface="raised">
        {character.skills.map(({ source, skill }) => {
          const isUsed = sourceUsed(source);
          const cooldown = player.cooldowns[skill.key] ?? 0;
          const offensive = affectsEnemy(skill);
          const blockedByFear = playerFear > 0 && offensive;
          const blocked = isUsed || cooldown > 0 || playerSkillBlocked || blockedByFear || finished;
          return (
            <button
              key={`${source}-${skill.key}`}
              type="button"
              disabled={blocked}
              data-selected={action?.kind === "skill" && action.skill.key === skill.key ? "true" : "false"}
              onClick={() => selectAction({ kind: "skill", name: skill.name, range: skill.range, area: skill.area, source, skill })}
            >
              <strong>{skill.name}</strong>
              <span>{source === "class" ? "Classe" : "Raça"} · Alcance {skill.range} · Área {skill.area}</span>
              <small>
                {playerStun > 0
                  ? "Bloqueada por STUN"
                  : playerSilence > 0
                    ? "Bloqueada por SILENCE"
                    : blockedByFear
                      ? "Bloqueada por FEAR"
                      : cooldown > 0
                        ? `Cooldown ${cooldown}`
                        : skill.cost
                          ? `${skill.cost} ${skill.resource}`
                          : "Sem custo"}
              </small>
              <small>{skill.operations.map((operation) => `${operation.operation}:${operation.target}`).join(" → ")}</small>
            </button>
          );
        })}
        {character.items.map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={usedItem || playerStun > 0 || finished}
            onClick={() => useItem(item)}
          >
            <strong>{item.name}</strong>
            <span>Item ativo · 1 por turno</span>
            <small>{playerStun > 0 ? "Bloqueado por STUN" : usedItem ? "USADO" : "DISPONÍVEL"}</small>
          </button>
        ))}
      </div>

      <div className={styles.workspace}>
        <div className={styles.boardShell} data-wl-surface="dark">
          <div className={styles.board} style={{ gridTemplateColumns: `repeat(${GRID.width}, minmax(0, 1fr))` }}>
            {cells.map((position) => {
              const key = tacticalPositionKey(position);
              const isPlayer = key === tacticalPositionKey(playerPosition);
              const isEnemy = key === tacticalPositionKey(enemyPosition);
              const isObstacle = obstacles.has(key);
              const isReachable = !action && playerStun <= 0 && reachable.has(key);
              const inRange = Boolean(action && playerStun <= 0 && getTacticalDistance(playerPosition, position) <= action.range);
              const isArea = areaCells.has(key);
              const state = isPlayer ? "player" : isEnemy ? "enemy" : isObstacle ? "obstacle" : isArea ? "area" : isReachable ? "reachable" : inRange ? "range" : "empty";
              return (
                <button
                  key={key}
                  type="button"
                  className={styles.cell}
                  data-state={state}
                  onClick={() => clickCell(position)}
                  aria-label={isPlayer ? player.name : isEnemy ? creature.name : isObstacle ? "Obstáculo" : `Casa ${position.x + 1}, ${position.y + 1}`}
                >
                  {isPlayer ? <span className={styles.unit}>♞</span> : null}
                  {isEnemy ? <span className={styles.unit}>♜</span> : null}
                  {isObstacle ? <span className={styles.obstacle}>◆</span> : null}
                </button>
              );
            })}
          </div>
        </div>
        <aside className={styles.sidePanel} data-wl-surface="raised">
          <div><span className={styles.eyebrow}>Economia do turno</span><h2>1 + 1 + 1 + 1</h2></div>
          <ul>
            <li>Ataque Básico: {playerStun > 0 ? "bloqueado por STUN" : playerFear > 0 ? "bloqueado por FEAR" : usedBasic ? "usado" : "disponível"}</li>
            <li>Classe: {playerStun > 0 ? "bloqueada por STUN" : playerSilence > 0 ? "bloqueada por SILENCE" : usedClass ? "usada" : "disponível"}</li>
            <li>Raça: {playerStun > 0 ? "bloqueada por STUN" : playerSilence > 0 ? "bloqueada por SILENCE" : usedRace ? "usada" : "disponível"}</li>
            <li>Item: {character.items.length ? (playerStun > 0 ? "bloqueado por STUN" : usedItem ? "usado" : "disponível") : "nenhum"}</li>
            <li>IA: {profile.aiProfile}</li>
            <li>Skills da criatura: {creatureSkills.map((skill) => skill.name).join(" · ")}</li>
          </ul>
          <p className={styles.message} role="status">{message}</p>
          <div className={styles.combatLog}>
            <small>LOG</small>
            {log.map((entry, index) => <p key={`${index}-${entry}`}>{entry}</p>)}
          </div>
        </aside>
      </div>
    </section>
  );
}
