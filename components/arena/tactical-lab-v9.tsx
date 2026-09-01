"use client";

import { useMemo, useState } from "react";

import styles from "@/app/arena/mapa-tatico/tactical-lab.module.css";
import {
  createCombatant,
  resolveBasicAttack,
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
  getTacticalCombatOutcome,
  getTacticalCombatOutcomeMessage,
  isTacticalCombatFinished,
  shouldStartNextTacticalRound,
} from "@/lib/game/tactical-combat-outcome";
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
import { applyTacticalBasicAttackReactions } from "@/lib/game/tactical-basic-reactions";
import {
  applyNecromancerSummonExpiry,
  applyTacticalClassResourceGeneration,
  initialTacticalClassResourceTracker,
  markTacticalMovement,
  resetTacticalClassResourceRound,
  type TacticalClassResourceTracker,
} from "@/lib/game/tactical-class-resource";
import {
  applyTacticalPathAfterAction,
  applyTacticalPathIncoming,
  applyTacticalPathSummonExpiry,
  applyTacticalPathTurnEnd,
  consumeTacticalPathItemAction,
  initialTacticalPathTracker,
  markTacticalPathMovement,
  prepareTacticalPathSkill,
  tacticalPathIgnoresLineOfSight,
  type TacticalPathTracker,
} from "@/lib/game/tactical-path-passives";
import { applyTacticalRacialReaction } from "@/lib/game/tactical-race-reactions";
import { resolveTacticalSkill } from "@/lib/game/tactical-skill";
import { applyTacticalSpatialSkill } from "@/lib/game/tactical-spatial-skill";
import {
  completeEnemyTacticalTurn,
  prepareEnemyTacticalTurn,
} from "@/lib/game/tactical-turn-timing";

type SkillSource = "class" | "race";
type TacticalItem = { id: string; name: string; description: string };
type TacticalCharacter = {
  id: string;
  name: string;
  level: number;
  rank: string;
  raceName: string;
  className: string;
  classPathKey: string | null;
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
    classResource: { ...character.classResource, generationEvents: [] },
    raceResource: character.raceResource ? { ...character.raceResource, generationEvents: [] } : null,
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
  return skill.operations.some((operation) => operation.target === "enemy" || operation.target === "area");
}

function hasSelfSpatialMovement(skill: ClassSkill) {
  return skill.operations.some(
    (operation) =>
      (operation.operation === "MOVE" || operation.operation === "TELEPORT") &&
      (operation.target === "self" || operation.target === "source"),
  );
}

function isFirstAction(usedBasic: boolean, usedClass: boolean, usedRace: boolean, usedItem: boolean) {
  return !usedBasic && !usedClass && !usedRace && !usedItem;
}

function totalDurability(combatant: CombatantState) {
  return combatant.hp + combatant.shield;
}

function isMarked(combatant: CombatantState) {
  return Object.entries(combatant.statuses).some(([key, status]) =>
    /marca|mark|selo/.test(`${key} ${status.name}`.toLowerCase()),
  );
}

function summonExpired(before: CombatantState["statuses"], after: CombatantState["statuses"]) {
  return Object.entries(before).some(
    ([key, status]) =>
      !after[key] && /servo|esqueleto|avatar|invoc/i.test(`${key} ${status.name}`.toLowerCase()),
  );
}

export function TacticalLabV9({
  characters,
  creatures,
}: {
  characters: TacticalCharacter[];
  creatures: TacticalBestiaryCreature[];
}) {
  const firstCharacter = characters[0];
  const firstCreature = creatures.find((entry) => entry.rank === firstCharacter?.rank) ?? creatures[0];
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
  const [classTracker, setClassTracker] = useState<TacticalClassResourceTracker>(initialTacticalClassResourceTracker);
  const [pathTracker, setPathTracker] = useState<TacticalPathTracker>(initialTacticalPathTracker);
  const [movement, setMovement] = useState(PLAYER_MOVE);
  const [action, setAction] = useState<PlayerAction | null>(null);
  const [areaCenter, setAreaCenter] = useState<TacticalPosition | null>(null);
  const [usedBasic, setUsedBasic] = useState(false);
  const [usedClass, setUsedClass] = useState(false);
  const [usedRace, setUsedRace] = useState(false);
  const [usedItem, setUsedItem] = useState(false);
  const [round, setRound] = useState(1);
  const [message, setMessage] = useState("V9: ciclo de combate e encerramento seguro carregados.");
  const [log, setLog] = useState<string[]>([
    "V9: skills + recursos + reações + Doutrinas + ciclo de combate em execução.",
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
    return <section className={styles.empty}>É necessário ter personagem e criatura disponíveis.</section>;
  }

  const player = playerState;
  const enemy = enemyState;
  const profile = creature.combatProfile;
  const creatureSkills = profile.skills.length ? profile.skills : [createDefaultCreatureSkill(creature)];
  const playerRoot = getTacticalRootTurns(player);
  const playerStun = getTacticalStunTurns(player);
  const playerSilence = getTacticalSilenceTurns(player);
  const playerFear = getTacticalFearTurns(player);
  const playerTaunt = getTacticalTaunt(player);
  const enemyRoot = getTacticalRootTurns(enemy);
  const enemyStun = getTacticalStunTurns(enemy);
  const enemySilence = getTacticalSilenceTurns(enemy);
  const enemyFear = getTacticalFearTurns(enemy);
  const enemyTaunt = getTacticalTaunt(enemy);
  const outcome = getTacticalCombatOutcome(player, enemy);
  const finished = isTacticalCombatFinished(outcome);
  const rankMismatch = character.rank !== creature.rank;

  function addLog(text: string) {
    setLog((current) => [text, ...current].slice(0, 24));
  }

  function outcomeMessage(nextPlayer: CombatantState, nextEnemy: CombatantState) {
    const nextOutcome = getTacticalCombatOutcome(nextPlayer, nextEnemy);
    return isTacticalCombatFinished(nextOutcome)
      ? getTacticalCombatOutcomeMessage({
          outcome: nextOutcome,
          playerName: nextPlayer.name,
          enemyName: nextEnemy.name,
        })
      : null;
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
    setClassTracker(initialTacticalClassResourceTracker);
    setPathTracker(initialTacticalPathTracker);
    resetTurnActions();
    setRound(1);
    setLog([`V9 reiniciada: ${nextCharacter.name} vs ${nextCreature.name}.`]);
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

  function sourceUsed(source: SkillSource) {
    return source === "class" ? usedClass : usedRace;
  }

  function selectAction(next: PlayerAction) {
    if (finished) return setMessage(getTacticalCombatOutcomeMessage({ outcome, playerName: player.name, enemyName: enemy.name }));
    if (playerStun > 0) return setMessage(`STUN: você não pode agir por ${playerStun} turno(s).`);
    if (next.kind === "basic") {
      if (playerFear > 0) return setMessage(`FEAR: ações ofensivas bloqueadas por ${playerFear} turno(s).`);
      if (usedBasic) return setMessage("Ataque Básico já usado neste turno.");
    } else {
      if (playerSilence > 0) return setMessage(`SILENCE: habilidades bloqueadas por ${playerSilence} turno(s).`);
      if (playerFear > 0 && affectsEnemy(next.skill)) return setMessage("FEAR: habilidade ofensiva bloqueada.");
      if (sourceUsed(next.source)) return setMessage(`Habilidade de ${next.source === "class" ? "Classe" : "Raça"} já usada neste turno.`);
      const cooldown = player.cooldowns[next.skill.key] ?? 0;
      if (cooldown > 0) return setMessage(`${next.name} está em cooldown por ${cooldown} turno(s).`);
    }
    setAction(next);
    setAreaCenter(null);
    setMessage(`${next.name} selecionado.`);
  }

  function executePlayerSkill(selected: Extract<PlayerAction, { kind: "skill" }>, center: TacticalPosition) {
    if (finished) return setMessage(getTacticalCombatOutcomeMessage({ outcome, playerName: player.name, enemyName: enemy.name }));
    if (playerStun > 0) return setMessage("STUN impede a habilidade.");
    if (playerSilence > 0) return setMessage("SILENCE impede a habilidade.");
    if (playerFear > 0 && affectsEnemy(selected.skill)) return setMessage("FEAR impede a habilidade ofensiva.");

    if (selected.area > 0 && affectsEnemy(selected.skill)) {
      const affected = getTacticalAreaCells({ center, radius: selected.area, grid: GRID });
      if (!affected.has(tacticalPositionKey(enemyPosition))) return setMessage(`A área não atingiu ${creature.name}.`);
    }

    const firstAction = isFirstAction(usedBasic, usedClass, usedRace, usedItem);
    const targetDistance = affectsEnemy(selected.skill) ? getTacticalDistance(playerPosition, enemyPosition) : 0;
    const beforePlayer = player;
    const beforeEnemy = enemy;
    const targetMarked = isMarked(beforeEnemy);
    const preparedPath = prepareTacticalPathSkill({
      pathKey: character.classPathKey,
      tracker: pathTracker,
      actor: player,
      target: affectsEnemy(selected.skill) ? enemy : player,
      skill: selected.skill,
    });
    const tacticalSkill = preparedPath.skill;
    const classResourceBefore = player.classResource;
    const result = resolveTacticalSkill(player, enemy, tacticalSkill, undefined, {
      distance: targetDistance,
      firstSuccessfulActionThisRound: firstAction,
    });
    if (result.event.kind === "error") return setMessage(result.event.message);

    const controlResult = applyCreatureControlResistances({
      before: beforeEnemy,
      after: result.target,
      skill: tacticalSkill,
      resistances: profile.resistances,
    });
    const damageTraits = applyCreatureDamageTraits({
      before: beforeEnemy,
      after: controlResult.target,
      skill: tacticalSkill,
      weaknesses: creature.weaknesses,
      resistances: profile.resistances,
    });
    const targetDefeatedBeforeSpatial = damageTraits.target.hp <= 0;
    const spatial = targetDefeatedBeforeSpatial
      ? { playerPosition, enemyPosition, messages: [] as string[] }
      : applyTacticalSpatialSkill({
          skill: tacticalSkill,
          successfulOperationIndexes: result.successfulOperationIndexes,
          playerPosition,
          enemyPosition,
          selectedPosition: center,
          obstacles,
          grid: GRID,
        });
    const dealtDamage = Math.max(0, totalDurability(beforeEnemy) - totalDurability(damageTraits.target));
    const healed = Math.max(0, result.actor.hp - beforePlayer.hp);
    const shieldGranted = Math.max(0, result.actor.shield - beforePlayer.shield);
    const classGeneration = applyTacticalClassResourceGeneration({
      combatant: result.actor,
      className: character.className,
      tracker: classTracker,
      context: {
        action: "skill",
        skill: tacticalSkill,
        successfulOperationIndexes: result.successfulOperationIndexes,
        dealtDamage,
        damageType: result.event.damageType,
        distance: targetDistance,
        healed,
        shieldGranted,
        affectedTargets: 1,
        targetId: affectsEnemy(tacticalSkill) ? enemy.id : player.id,
        targetMaxHp: affectsEnemy(tacticalSkill) ? enemy.maxHp : player.maxHp,
        targetHasActed: false,
        targetMarked,
      },
    });
    const pathResult = applyTacticalPathAfterAction({
      pathKey: character.classPathKey,
      tracker: pathTracker,
      actorBefore: beforePlayer,
      targetBefore: beforeEnemy,
      actorAfter: classGeneration.combatant,
      targetAfter: damageTraits.target,
      context: {
        skill: tacticalSkill,
        successfulOperationIndexes: result.successfulOperationIndexes,
        dealtDamage,
        damageType: result.event.damageType,
        distance: targetDistance,
        targetMarked,
        movedBeforeAction: pathTracker.movedThisTurn,
        healed,
        shieldGranted,
        classResourceBefore,
        classResourceAfterCost: result.actor.classResource,
      },
    });

    setPlayerState(pathResult.actor);
    setClassTracker(classGeneration.tracker);
    setPathTracker(pathResult.tracker);
    setEnemyState(pathResult.target);
    setPlayerPosition(spatial.playerPosition);
    setEnemyPosition(spatial.enemyPosition);
    if (selected.source === "class") setUsedClass(true);
    else setUsedRace(true);

    const traitText = damageTraits.neutralized
      ? ` FRAQUEZA/RESISTÊNCIA ANULADAS (${damageTraits.weakness} × ${damageTraits.resistance}).`
      : `${damageTraits.weakness ? ` FRAQUEZA (${damageTraits.weakness}): +${damageTraits.bonusDamage}.` : ""}${damageTraits.resistance ? ` RESISTÊNCIA (${damageTraits.resistance}): -${damageTraits.reducedDamage}.` : ""}`;
    const controlText = controlResult.resisted.length
      ? ` ${controlResult.resisted.map((entry) => `RESISTÊNCIA A ${entry.operation}: -${entry.reducedTurns} turno.`).join(" ")}`
      : "";
    const doctrineText = [...preparedPath.messages, ...pathResult.messages].join(" ");
    const text = `${result.event.message}${traitText}${controlText}${spatial.messages.length ? ` ${spatial.messages.join(" ")}` : ""}${classGeneration.message ? ` ${classGeneration.message}` : ""}${doctrineText ? ` ${doctrineText}` : ""}`;
    const endText = outcomeMessage(pathResult.actor, pathResult.target);
    const finalText = endText ? `${text} ${endText}` : text;
    setMessage(finalText);
    addLog(finalText);
    clearAction();
  }

  function clickCell(position: TacticalPosition) {
    if (finished) {
      return setMessage(getTacticalCombatOutcomeMessage({ outcome, playerName: player.name, enemyName: enemy.name }));
    }

    const key = tacticalPositionKey(position);
    if (!action) {
      if (playerStun > 0) return setMessage("STUN impede movimento.");
      if (playerRoot > 0) return setMessage(`ROOT impede movimento por ${playerRoot} turno(s).`);
      if (!reachable.has(key)) return;
      const cost = reachable.get(key) ?? 0;
      setPlayerPosition(position);
      setMovement((current) => Math.max(0, current - cost));
      if (cost > 0) {
        setClassTracker((current) => markTacticalMovement(current, true));
        setPathTracker((current) => markTacticalPathMovement(current, true));
      }
      setMessage(`Movimento: ${cost} ponto(s) consumido(s).`);
      return;
    }

    if (playerStun > 0) return setMessage("STUN impede a ação.");
    if (obstacles.has(key)) return setMessage("Essa casa está bloqueada.");
    const distance = getTacticalDistance(playerPosition, position);
    if (distance > action.range) return setMessage(`${action.name}: fora do alcance (${distance}/${action.range}).`);

    if (action.kind === "basic") {
      if (playerFear > 0) return setMessage("FEAR impede o ataque.");
      if (key !== tacticalPositionKey(enemyPosition)) return setMessage(`Selecione ${creature.name}.`);
      const sight = hasTacticalLineOfSight({ from: playerPosition, to: enemyPosition, blocked: obstacles });
      if (!sight && !tacticalPathIgnoresLineOfSight(character.classPathKey, enemy)) {
        return setMessage("Linha de visão bloqueada.");
      }

      const beforeEnemy = enemy;
      const result = resolveBasicAttack(player, enemy);
      if (result.event.kind === "error") return setMessage(result.event.message);
      const resistanceResult = applyCreatureBasicAttackResistance({
        before: enemy,
        after: result.target,
        damageType: character.basicAttackDamageType,
        resistances: profile.resistances,
      });
      const reactions = resistanceResult.target.hp <= 0
        ? { actor: result.actor, target: resistanceResult.target, dealtDamage: result.event.amount, messages: [] as string[] }
        : applyTacticalBasicAttackReactions({
            actorBefore: player,
            targetBefore: beforeEnemy,
            actorAfter: result.actor,
            targetAfter: resistanceResult.target,
            damageType: character.basicAttackDamageType,
            distance: getTacticalDistance(playerPosition, enemyPosition),
            firstSuccessfulActionThisRound: isFirstAction(usedBasic, usedClass, usedRace, usedItem),
          });
      const basicDistance = getTacticalDistance(playerPosition, enemyPosition);
      const classGeneration = applyTacticalClassResourceGeneration({
        combatant: reactions.actor,
        className: character.className,
        tracker: classTracker,
        context: {
          action: "basic",
          dealtDamage: reactions.dealtDamage,
          damageType: character.basicAttackDamageType,
          distance: basicDistance,
          targetId: enemy.id,
          targetMaxHp: enemy.maxHp,
          targetHasActed: false,
          targetMarked: isMarked(beforeEnemy),
        },
      });
      const pathResult = applyTacticalPathAfterAction({
        pathKey: character.classPathKey,
        tracker: pathTracker,
        actorBefore: player,
        targetBefore: beforeEnemy,
        actorAfter: classGeneration.combatant,
        targetAfter: reactions.target,
        context: {
          dealtDamage: reactions.dealtDamage,
          damageType: character.basicAttackDamageType,
          distance: basicDistance,
          targetMarked: isMarked(beforeEnemy),
          movedBeforeAction: pathTracker.movedThisTurn,
        },
      });
      const resistanceText = resistanceResult.resistance
        ? ` RESISTÊNCIA (${resistanceResult.resistance}): -${resistanceResult.reducedDamage}.`
        : "";
      const doctrineText = pathResult.messages.length ? ` ${pathResult.messages.join(" ")}` : "";
      const text = `${result.event.message}${resistanceText}${reactions.messages.length ? ` ${reactions.messages.join(" ")}` : ""}${classGeneration.message ? ` ${classGeneration.message}` : ""}${doctrineText}`;
      setPlayerState(pathResult.actor);
      setClassTracker(classGeneration.tracker);
      setPathTracker(pathResult.tracker);
      setEnemyState(pathResult.target);
      setUsedBasic(true);
      const endText = outcomeMessage(pathResult.actor, pathResult.target);
      const finalText = endText ? `${text} ${endText}` : text;
      setMessage(finalText);
      addLog(finalText);
      clearAction();
      return;
    }

    const targetsEnemy = affectsEnemy(action.skill);
    const spatialSelf = hasSelfSpatialMovement(action.skill);
    if (playerSilence > 0) return setMessage("SILENCE impede habilidades.");
    if (playerFear > 0 && targetsEnemy) return setMessage("FEAR impede habilidades ofensivas.");
    if (!targetsEnemy && !spatialSelf && key !== tacticalPositionKey(playerPosition)) {
      return setMessage(`${action.name}: selecione seu personagem.`);
    }
    if (targetsEnemy && action.area <= 0 && key !== tacticalPositionKey(enemyPosition)) {
      return setMessage(`Selecione ${creature.name}.`);
    }
    const sight = hasTacticalLineOfSight({ from: playerPosition, to: position, blocked: obstacles });
    if (targetsEnemy && !sight && !tacticalPathIgnoresLineOfSight(character.classPathKey, enemy)) {
      return setMessage(`${action.name}: linha de visão bloqueada.`);
    }
    if (action.area > 0) setAreaCenter(position);
    executePlayerSkill(action, position);
  }

  function useItem(item: TacticalItem) {
    if (usedItem || finished) return;
    if (playerStun > 0) return setMessage("STUN impede uso de item.");
    const healed = Math.min(Math.max(25, Math.round(player.maxHp * 0.25)), player.maxHp - player.hp);
    if (healed <= 0) return setMessage("Seu HP já está cheio.");
    let nextPlayer: CombatantState = { ...player, hp: player.hp + healed };
    const reaction = applyTacticalRacialReaction(nextPlayer, nextPlayer.raceResourceName, {
      firstSuccessfulActionThisRound: isFirstAction(usedBasic, usedClass, usedRace, usedItem),
    });
    nextPlayer = reaction.combatant;
    const itemDoctrine = consumeTacticalPathItemAction(character.classPathKey, pathTracker);
    setPathTracker(itemDoctrine.tracker);
    setPlayerState(nextPlayer);
    if (itemDoctrine.consumeAction) setUsedItem(true);
    const text = `${player.name} usou ${item.name} e recuperou ${healed} HP.${reaction.message ? ` ${reaction.message}` : ""}${itemDoctrine.message ? ` ${itemDoctrine.message}` : ""}`;
    setMessage(text);
    addLog(text);
  }

  function applyIncomingClassGeneration(before: CombatantState, after: CombatantState, tracker: TacticalClassResourceTracker) {
    const tookDamage = Math.max(0, totalDurability(before) - totalDurability(after));
    const shieldAbsorbed = Math.max(0, before.shield - after.shield);
    return applyTacticalClassResourceGeneration({
      combatant: after,
      className: character.className,
      tracker,
      context: {
        action: "incoming",
        tookDamage,
        shieldAbsorbed,
        targetId: player.id,
        targetMaxHp: player.maxHp,
      },
    });
  }

  function executeEnemyTurn() {
    if (finished) {
      setMessage(getTacticalCombatOutcomeMessage({ outcome, playerName: player.name, enemyName: enemy.name }));
      return;
    }

    const prepared = prepareEnemyTacticalTurn(player, enemy);
    let nextPlayer = prepared.player;
    let nextEnemy = prepared.enemy;
    let nextTracker = classTracker;
    let nextPathTracker = pathTracker;
    let nextPlayerPosition = playerPosition;
    let nextEnemyPosition = enemyPosition;
    const notes = [`Rodada ${round}: ${creature.name} (${profile.aiProfile}).`];

    const currentEnemyStun = getTacticalStunTurns(nextEnemy);
    const currentEnemyFear = getTacticalFearTurns(nextEnemy);
    const currentEnemyRoot = getTacticalRootTurns(nextEnemy);
    const currentEnemySilence = getTacticalSilenceTurns(nextEnemy);
    const currentEnemyTaunt = getTacticalTaunt(nextEnemy);

    if (currentEnemyStun > 0) {
      notes.push(`${creature.name} perdeu a ação por STUN.`);
    } else if (currentEnemyFear > 0) {
      if (currentEnemyRoot > 0) {
        notes.push(`${creature.name} está com FEAR, mas ROOT impede a fuga.`);
      } else {
        const flee = chooseTacticalFleeDestination({
          start: nextEnemyPosition,
          threat: nextPlayerPosition,
          movement: profile.movement,
          grid: GRID,
          blocked: obstacles,
        });
        nextEnemyPosition = flee.position;
        notes.push(flee.movementCost > 0 ? `${creature.name} fugiu ${flee.movementCost} casa(s).` : "Sem rota de fuga.");
      }
      notes.push("FEAR bloqueou a ação ofensiva da criatura.");
    } else {
      const planningRange = getCreaturePlanningSkillRange({
        skills: creatureSkills,
        cooldowns: nextEnemy.cooldowns,
        profile: profile.aiProfile,
        fallbackRange: profile.basicAttackRange,
      });
      const hasReadySkill = currentEnemySilence <= 0 && creatureSkills.some((skill) => (nextEnemy.cooldowns[skill.key] ?? 0) <= 0);

      if (currentEnemyRoot <= 0) {
        const decision = chooseTacticalProfileDestination({
          profile: profile.aiProfile,
          start: nextEnemyPosition,
          target: nextPlayerPosition,
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
      } else {
        notes.push(`ROOT: criatura não pode se mover por ${currentEnemyRoot} turno(s).`);
      }

      const distance = getTacticalDistance(nextEnemyPosition, nextPlayerPosition);
      const sight = hasTacticalLineOfSight({ from: nextEnemyPosition, to: nextPlayerPosition, blocked: obstacles });
      const selectedEnemySkill = sight && currentEnemySilence <= 0
        ? chooseCreatureTacticalSkill({
            skills: creatureSkills,
            cooldowns: nextEnemy.cooldowns,
            distance,
            profile: profile.aiProfile,
          })
        : null;
      if (currentEnemyTaunt) notes.push(`TAUNT ativo: alvo obrigatório ${currentEnemyTaunt.targetId}.`);

      if (selectedEnemySkill) {
        const beforePlayer = nextPlayer;
        const result = resolveTacticalSkill(nextEnemy, nextPlayer, selectedEnemySkill, undefined, { distance });
        nextEnemy = result.actor;
        const incomingClass = applyIncomingClassGeneration(beforePlayer, result.target, nextTracker);
        nextTracker = incomingClass.tracker;
        const incomingPath = applyTacticalPathIncoming({
          pathKey: character.classPathKey,
          tracker: nextPathTracker,
          before: beforePlayer,
          after: incomingClass.combatant,
          basicAttack: false,
        });
        nextPlayer = incomingPath.combatant;
        nextPathTracker = incomingPath.tracker;
        notes.push(`${result.event.message}${incomingClass.message ? ` ${incomingClass.message}` : ""}${incomingPath.messages.length ? ` ${incomingPath.messages.join(" ")}` : ""}`);

        if (nextPlayer.hp > 0) {
          const successful = new Set(result.successfulOperationIndexes);
          const pushEntry = selectedEnemySkill.operations.findIndex((operation) => operation.operation === "PUSH");
          if (pushEntry >= 0 && successful.has(pushEntry)) {
            const push = selectedEnemySkill.operations[pushEntry];
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
        }
      } else if (distance <= profile.basicAttackRange && sight) {
        const beforePlayer = nextPlayer;
        const result = resolveBasicAttack(nextEnemy, nextPlayer);
        if (result.event.kind === "error") {
          notes.push(result.event.message);
        } else {
          const reactions = result.target.hp <= 0
            ? { actor: result.actor, target: result.target, messages: [] as string[] }
            : applyTacticalBasicAttackReactions({
                actorBefore: nextEnemy,
                targetBefore: beforePlayer,
                actorAfter: result.actor,
                targetAfter: result.target,
                damageType: profile.basicAttackDamageType,
                distance,
              });
          nextEnemy = reactions.actor;
          const incomingClass = applyIncomingClassGeneration(beforePlayer, reactions.target, nextTracker);
          nextTracker = incomingClass.tracker;
          const incomingPath = applyTacticalPathIncoming({
            pathKey: character.classPathKey,
            tracker: nextPathTracker,
            before: beforePlayer,
            after: incomingClass.combatant,
            basicAttack: true,
          });
          nextPlayer = incomingPath.combatant;
          nextPathTracker = incomingPath.tracker;
          notes.push(currentEnemySilence > 0 ? "SILENCE: IA recorreu ao Ataque Básico." : "IA usou Ataque Básico.");
          notes.push(`${result.event.message}${reactions.messages.length ? ` ${reactions.messages.join(" ")}` : ""}${incomingClass.message ? ` ${incomingClass.message}` : ""}${incomingPath.messages.length ? ` ${incomingPath.messages.join(" ")}` : ""}`);
        }
      } else {
        notes.push(`Sem ação ofensiva válida. Distância ${distance}.`);
      }
    }

    const immediateOutcome = getTacticalCombatOutcome(nextPlayer, nextEnemy);
    if (isTacticalCombatFinished(immediateOutcome)) {
      const endText = getTacticalCombatOutcomeMessage({
        outcome: immediateOutcome,
        playerName: nextPlayer.name,
        enemyName: nextEnemy.name,
      });
      setEnemyPosition(nextEnemyPosition);
      setPlayerPosition(nextPlayerPosition);
      setPlayerState(nextPlayer);
      setEnemyState(nextEnemy);
      setClassTracker(nextTracker);
      setPathTracker(nextPathTracker);
      clearAction();
      notes.forEach(addLog);
      addLog(endText);
      setMessage(`${notes.join(" ")} ${endText}`);
      return;
    }

    const beforeCompletion = nextPlayer;
    const completed = completeEnemyTacticalTurn(nextPlayer, nextEnemy);
    const didSummonExpire = summonExpired(beforeCompletion.statuses, completed.player.statuses);
    const necromancerExpiry = applyNecromancerSummonExpiry(
      completed.player,
      character.className,
      beforeCompletion.statuses,
      completed.player.statuses,
    );
    let afterExpiry = necromancerExpiry.combatant;
    if (necromancerExpiry.message) notes.push(necromancerExpiry.message);
    const pathSummon = applyTacticalPathSummonExpiry({
      pathKey: character.classPathKey,
      tracker: nextPathTracker,
      combatant: afterExpiry,
      expired: didSummonExpire,
    });
    afterExpiry = pathSummon.combatant;
    nextPathTracker = pathSummon.tracker;
    if (pathSummon.message) notes.push(pathSummon.message);
    const pathTurnEnd = applyTacticalPathTurnEnd({
      pathKey: character.classPathKey,
      tracker: nextPathTracker,
      combatant: afterExpiry,
    });
    nextPlayer = pathTurnEnd.combatant;
    nextPathTracker = pathTurnEnd.tracker;
    nextEnemy = completed.enemy;
    if (pathTurnEnd.messages.length) notes.push(...pathTurnEnd.messages);

    const finalOutcome = getTacticalCombatOutcome(nextPlayer, nextEnemy);
    const startsNextRound = shouldStartNextTacticalRound(finalOutcome);

    setEnemyPosition(nextEnemyPosition);
    setPlayerPosition(nextPlayerPosition);
    setPlayerState(nextPlayer);
    setEnemyState(nextEnemy);
    setClassTracker(startsNextRound ? resetTacticalClassResourceRound(nextTracker) : nextTracker);
    setPathTracker(nextPathTracker);

    notes.forEach(addLog);
    if (startsNextRound) {
      resetTurnActions();
      setRound((value) => value + 1);
      setMessage(`${notes.join(" ")} Seu turno.`);
    } else {
      clearAction();
      const endText = getTacticalCombatOutcomeMessage({
        outcome: finalOutcome,
        playerName: nextPlayer.name,
        enemyName: nextEnemy.name,
      });
      addLog(endText);
      setMessage(`${notes.join(" ")} ${endText}`);
    }
  }

  const playerSkillBlocked = playerStun > 0 || playerSilence > 0;
  const playerOffenseBlocked = playerStun > 0 || playerFear > 0;

  return (
    <section className={styles.lab} aria-label="Laboratório do mapa tático V8">
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Somente ADM · motor tático V9</span>
          <h1>Laboratório do Mapa Tático</h1>
          <p>Skills, recursos, reações, Doutrinas, alcance, controles e ciclo de combate.</p>
        </div>
        <div className={styles.status}><small>{finished ? "Finalizado" : "Funcional"}</small><strong>V9 · Rodada {round}</strong></div>
      </header>

      <section className={styles.characterPanel} data-wl-surface="raised">
        <label><span>Personagem</span><select value={character.id} onChange={(event) => changeCharacter(event.target.value)}>{characters.map((entry) => <option key={entry.id} value={entry.id}>{entry.name} · Rank {entry.rank} · {entry.className}</option>)}</select></label>
        <label><span>Criatura do Bestiário</span><select value={creature.id} onChange={(event) => changeCreature(event.target.value)}>{creatures.map((entry) => <option key={entry.id} value={entry.id}>{entry.name} · Rank {entry.rank} · {entry.combatProfile.aiProfile}</option>)}</select></label>
        <div className={styles.characterSummary}><strong>{character.name}</strong><span>{character.raceName} · {character.className} · Rank {character.rank}</span><span>Caminho: {character.classPathKey ?? "não escolhido"}</span><span>{rankMismatch ? `TESTE FORA DO RANK: criatura Rank ${creature.rank}` : `Pareamento de Rank válido: ${creature.rank}`}</span></div>
      </section>

      <section className={styles.combatHud}>
        <article>
          <small>AVENTUREIRO</small><strong>{player.name}</strong><div className={styles.bar}><i style={{ width: `${percent(player.hp, player.maxHp)}%` }} /></div><span>HP {player.hp}/{player.maxHp}</span>
          {player.maxMana > 0 ? <span>Mana {player.mana}/{player.maxMana}</span> : null}
          {player.maxClassResource > 0 ? <span>{player.classResourceName} {player.classResource}/{player.maxClassResource}</span> : null}
          {player.maxRaceResource > 0 ? <span>{player.raceResourceName} {player.raceResource}/{player.maxRaceResource}</span> : null}
          {playerRoot > 0 ? <span>ROOT: {playerRoot}</span> : null}{playerStun > 0 ? <span>STUN: {playerStun}</span> : null}{playerSilence > 0 ? <span>SILENCE: {playerSilence}</span> : null}{playerFear > 0 ? <span>FEAR: {playerFear}</span> : null}{playerTaunt ? <span>TAUNT: {playerTaunt.turns}</span> : null}
        </article>
        <article data-enemy="true">
          <small>BESTIÁRIO · RANK {creature.rank}</small><strong>{creature.name}</strong><div className={styles.bar}><i style={{ width: `${percent(enemy.hp, enemy.maxHp)}%` }} /></div><span>HP {enemy.hp}/{enemy.maxHp}</span><span>IA {profile.aiProfile} · Movimento {profile.movement} · Alcance básico {profile.basicAttackRange}</span><span>Fraquezas: {creature.weaknesses.length ? creature.weaknesses.join(" · ") : "nenhuma"}</span><span>Resistências: {profile.resistances.length ? profile.resistances.join(" · ") : "nenhuma"}</span>
          {enemyRoot > 0 ? <span>ROOT: {enemyRoot}</span> : null}{enemyStun > 0 ? <span>STUN: {enemyStun}</span> : null}{enemySilence > 0 ? <span>SILENCE: {enemySilence}</span> : null}{enemyFear > 0 ? <span>FEAR: {enemyFear}</span> : null}{enemyTaunt ? <span>TAUNT: {enemyTaunt.turns}</span> : null}
        </article>
      </section>

      <div className={styles.toolbar} data-wl-surface="raised">
        <button type="button" disabled={playerRoot > 0 || playerStun > 0 || finished} onClick={() => { clearAction(); setMessage(`Movimento: ${movement}/${PLAYER_MOVE}.`); }}>Movimento · {movement}/{PLAYER_MOVE}</button>
        <button type="button" disabled={usedBasic || playerOffenseBlocked || finished} data-wl-action={action?.kind === "basic" ? "primary" : undefined} onClick={() => selectAction({ kind: "basic", name: "Ataque Básico", range: character.basicAttackRange, area: 0 })}>Ataque · {usedBasic ? "USADO" : playerFear > 0 ? "BLOQUEADO" : "DISPONÍVEL"}</button>
        <button type="button" disabled={finished} onClick={executeEnemyTurn}>Encerrar turno → IA</button><button type="button" onClick={() => resetBoard()}>Reiniciar</button>
      </div>

      <div className={styles.skillBar} data-wl-surface="raised">
        {character.skills.map(({ source, skill }) => {
          const cooldown = player.cooldowns[skill.key] ?? 0;
          const blocked = sourceUsed(source) || cooldown > 0 || playerSkillBlocked || (playerFear > 0 && affectsEnemy(skill)) || finished;
          return <button key={`${source}-${skill.key}`} type="button" disabled={blocked} data-selected={action?.kind === "skill" && action.skill.key === skill.key ? "true" : "false"} onClick={() => selectAction({ kind: "skill", name: skill.name, range: skill.range, area: skill.area, source, skill })}><strong>{skill.name}</strong><span>{source === "class" ? "Classe" : "Raça"} · Alcance {skill.range} · Área {skill.area}</span><small>{cooldown > 0 ? `Cooldown ${cooldown}` : skill.cost ? `${skill.cost} ${skill.resource}` : "Sem custo"}</small><small>{skill.operations.map((operation) => `${operation.operation}:${operation.target}`).join(" → ")}</small></button>;
        })}
        {character.items.map((item) => <button key={item.id} type="button" disabled={usedItem || playerStun > 0 || finished} onClick={() => useItem(item)}><strong>{item.name}</strong><span>Item ativo · 1 por turno</span><small>{usedItem ? "USADO" : "DISPONÍVEL"}</small></button>)}
      </div>

      <div className={styles.workspace}>
        <div className={styles.boardShell} data-wl-surface="dark"><div className={styles.board} style={{ gridTemplateColumns: `repeat(${GRID.width}, minmax(0, 1fr))` }}>
          {cells.map((position) => {
            const key = tacticalPositionKey(position); const isPlayer = key === tacticalPositionKey(playerPosition); const isEnemy = key === tacticalPositionKey(enemyPosition); const isObstacle = obstacles.has(key); const isReachable = !finished && !action && playerStun <= 0 && reachable.has(key); const inRange = Boolean(!finished && action && playerStun <= 0 && getTacticalDistance(playerPosition, position) <= action.range); const isArea = !finished && areaCells.has(key); const state = isPlayer ? "player" : isEnemy ? "enemy" : isObstacle ? "obstacle" : isArea ? "area" : isReachable ? "reachable" : inRange ? "range" : "empty";
            return <button key={key} type="button" disabled={finished} className={styles.cell} data-state={state} onClick={() => clickCell(position)} aria-label={isPlayer ? player.name : isEnemy ? creature.name : isObstacle ? "Obstáculo" : `Casa ${position.x + 1}, ${position.y + 1}`}>{isPlayer ? <span className={styles.unit}>♞</span> : null}{isEnemy ? <span className={styles.unit}>♜</span> : null}{isObstacle ? <span className={styles.obstacle}>◆</span> : null}</button>;
          })}
        </div></div>
        <aside className={styles.sidePanel} data-wl-surface="raised"><div><span className={styles.eyebrow}>Economia do turno</span><h2>1 + 1 + 1 + 1</h2></div><ul><li>Resultado: {outcome}</li><li>Ataque Básico: {usedBasic ? "usado" : "disponível"}</li><li>Classe: {usedClass ? "usada" : "disponível"}</li><li>Raça: {usedRace ? "usada" : "disponível"}</li><li>Item: {character.items.length ? (usedItem ? "usado" : "disponível") : "nenhum"}</li><li>Doutrina: {character.classPathKey ?? "nenhuma"}</li><li>IA: {profile.aiProfile}</li><li>Skills da criatura: {creatureSkills.map((skill) => skill.name).join(" · ")}</li></ul><p className={styles.message} role="status">{message}</p><div className={styles.combatLog}><small>LOG</small>{log.map((entry, index) => <p key={`${index}-${entry}`}>{entry}</p>)}</div></aside>
      </div>
    </section>
  );
}
