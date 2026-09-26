"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";

import styles from "@/components/arena/tactical-combat-core.module.css";
import { CombatStatusDock } from "@/components/arena/combat-status-dock";
import { CombatFeedbackLayer } from "@/components/arena/combat-feedback-layer";
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
import { getTacticalMapById } from "@/lib/game/tactical-maps";
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
import {
  getTacticalActionAvailability,
  initialTacticalActionUsage,
  markTacticalActionUsed,
  resetTacticalActionUsage,
  type TacticalActionUsage,
} from "@/lib/game/tactical-action-economy";
import { resolveTacticalSkill } from "@/lib/game/tactical-skill";
import { applyTacticalSpatialSkill } from "@/lib/game/tactical-spatial-skill";
import {
  completeEnemyTacticalTurn,
  prepareEnemyTacticalTurn,
} from "@/lib/game/tactical-turn-timing";

type SkillSource = "class" | "race";
type TacticalItem = { id: string; name: string; description: string };
type TacticalSkill = ClassSkill & { iconUrl?: string };
type TacticalPassive = {
  key: string;
  name: string;
  description: string;
  iconUrl?: string;
  source: SkillSource;
};
export type TacticalCharacter = {
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
  basicAttack: { name: string; iconUrl?: string };
  passives: TacticalPassive[];
  skills: Array<{ source: SkillSource; skill: TacticalSkill }>;
  items: TacticalItem[];
};

export type TacticalBattleSnapshot = {
  version: 1;
  mapId: string;
  characterId: string;
  creatureId: string;
  playerState: CombatantState;
  enemyState: CombatantState;
  playerPosition: TacticalPosition;
  enemyPosition: TacticalPosition;
  classTracker: TacticalClassResourceTracker;
  pathTracker: TacticalPathTracker;
  movement: number;
  actionUsage: TacticalActionUsage;
  round: number;
  message: string;
  log: string[];
  outcome: "ongoing" | "victory" | "defeat" | "draw";
};

type PlayerAction =
  | { kind: "basic"; name: string; range: number; area: 0 }
  | {
      kind: "skill";
      name: string;
      range: number;
      area: number;
      source: SkillSource;
      skill: TacticalSkill;
    };

const PLAYER_MOVE = 4;

function makePlayer(character: TacticalCharacter) {
  return createCombatant({
    id: character.id,
    name: character.name,
    attributes: character.attributes,
    baseHp: character.baseHp,
    baseMana: character.baseMana,
    classResource: { ...character.classResource, generationEvents: [] },
    raceResource: character.raceResource
      ? { ...character.raceResource, generationEvents: [] }
      : null,
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

function hasSelfSpatialMovement(skill: ClassSkill) {
  return skill.operations.some(
    (operation) =>
      (operation.operation === "MOVE" || operation.operation === "TELEPORT") &&
      (operation.target === "self" || operation.target === "source"),
  );
}

function isFirstAction(
  usedBasic: boolean,
  usedClass: boolean,
  usedRace: boolean,
  usedItem: boolean,
) {
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

export function TacticalCombatCore({
  characters,
  creatures,
  mapId,
  locked = false,
  onVictory,
  onDefeat,
  initialState,
  onCheckpoint,
}: {
  characters: TacticalCharacter[];
  creatures: TacticalBestiaryCreature[];
  mapId: string;
  locked?: boolean;
  onVictory?: () => Promise<{ ok: boolean; message?: string; xp?: number; wg?: number }>;
  onDefeat?: () => Promise<{ ok: boolean; message?: string; xp?: number; wg?: number }>;
  initialState?: TacticalBattleSnapshot | null;
  onCheckpoint?: (state: TacticalBattleSnapshot) => Promise<void>;
}) {
  const tacticalMap = getTacticalMapById(mapId);
  const grid = tacticalMap.grid;
  const obstacles = useMemo(() => new Set(tacticalMap.obstacles), [tacticalMap]);
  const firstCharacter = characters[0];
  const firstCreature =
    creatures.find((entry) => entry.rank === firstCharacter?.rank) ?? creatures[0];
  const canResume =
    initialState?.mapId === mapId &&
    characters.some((entry) => entry.id === initialState.characterId) &&
    creatures.some((entry) => entry.id === initialState.creatureId);
  const [characterId, setCharacterId] = useState(
    canResume ? initialState.characterId : (firstCharacter?.id ?? ""),
  );
  const [creatureId, setCreatureId] = useState(
    canResume ? initialState.creatureId : (firstCreature?.id ?? ""),
  );
  const character = characters.find((entry) => entry.id === characterId) ?? firstCharacter;
  const creature = creatures.find((entry) => entry.id === creatureId) ?? firstCreature;
  const [playerPosition, setPlayerPosition] = useState<TacticalPosition>(
    canResume ? initialState.playerPosition : tacticalMap.playerStart,
  );
  const [enemyPosition, setEnemyPosition] = useState<TacticalPosition>(
    canResume ? initialState.enemyPosition : tacticalMap.enemyStart,
  );
  const [playerState, setPlayerState] = useState<CombatantState | null>(() =>
    canResume ? initialState.playerState : firstCharacter ? makePlayer(firstCharacter) : null,
  );
  const [enemyState, setEnemyState] = useState<CombatantState | null>(() =>
    canResume ? initialState.enemyState : firstCreature ? makeCreature(firstCreature) : null,
  );
  const [classTracker, setClassTracker] = useState<TacticalClassResourceTracker>(
    canResume ? initialState.classTracker : initialTacticalClassResourceTracker,
  );
  const [pathTracker, setPathTracker] = useState<TacticalPathTracker>(
    canResume ? initialState.pathTracker : initialTacticalPathTracker,
  );
  const [movement, setMovement] = useState(canResume ? initialState.movement : PLAYER_MOVE);
  const [action, setAction] = useState<PlayerAction | null>(null);
  const [areaCenter, setAreaCenter] = useState<TacticalPosition | null>(null);
  const [actionUsage, setActionUsage] = useState(
    canResume ? initialState.actionUsage : initialTacticalActionUsage,
  );
  const [round, setRound] = useState(canResume ? initialState.round : 1);
  const [message, setMessage] = useState(
    canResume ? initialState.message : `${tacticalMap.name}: combate pronto.`,
  );
  const [log, setLog] = useState<string[]>(
    canResume
      ? initialState.log
      : [
          `Mapa carregado: ${tacticalMap.name} (${grid.width}×${grid.height}, ${tacticalMap.obstacles.length} obstáculos).`,
        ],
  );
  const [settling, startSettlement] = useTransition();
  const [settlement, setSettlement] = useState<string | null>(null);
  const settledOutcome = useRef<string | null>(null);
  const liveOutcome =
    playerState && enemyState ? getTacticalCombatOutcome(playerState, enemyState) : "ongoing";

  useEffect(() => {
    if (liveOutcome !== "victory" && liveOutcome !== "defeat" && liveOutcome !== "draw") return;
    if (settledOutcome.current === liveOutcome) return;
    settledOutcome.current = liveOutcome;
    const settle = liveOutcome === "victory" ? onVictory : onDefeat;
    if (!settle) return;
    startSettlement(async () => {
      const result = await settle();
      setSettlement(
        result.ok
          ? liveOutcome === "victory"
            ? `Vitória confirmada: +${result.xp ?? 0} XP e +${result.wg ?? 0} WG.`
            : "Resultado registrado no histórico."
          : (result.message ?? "Não foi possível registrar o resultado."),
      );
    });
  }, [liveOutcome, onDefeat, onVictory]);

  useEffect(() => {
    if (!onCheckpoint || !playerState || !enemyState || liveOutcome !== "ongoing") return;
    const timer = window.setTimeout(() => {
      void onCheckpoint({
        version: 1,
        mapId,
        characterId,
        creatureId,
        playerState,
        enemyState,
        playerPosition,
        enemyPosition,
        classTracker,
        pathTracker,
        movement,
        actionUsage,
        round,
        message,
        log,
        outcome: liveOutcome,
      });
    }, 600);
    return () => window.clearTimeout(timer);
  }, [
    actionUsage,
    characterId,
    classTracker,
    creatureId,
    enemyPosition,
    enemyState,
    liveOutcome,
    log,
    mapId,
    message,
    movement,
    onCheckpoint,
    pathTracker,
    playerPosition,
    playerState,
    round,
  ]);

  const reachable = useMemo(
    () =>
      getReachableTacticalCells({
        start: playerPosition,
        blocked: new Set([...obstacles, tacticalPositionKey(enemyPosition)]),
        movement,
        grid,
      }),
    [playerPosition, enemyPosition, movement, obstacles, grid],
  );
  const areaCells = useMemo(
    () =>
      action && areaCenter
        ? getTacticalAreaCells({ center: areaCenter, radius: action.area, grid })
        : new Set<string>(),
    [action, areaCenter, grid],
  );
  const cells = useMemo(
    () =>
      Array.from({ length: grid.width * grid.height }, (_, index) => ({
        x: index % grid.width,
        y: Math.floor(index / grid.width),
      })),
    [grid],
  );

  if (!character || !creature || !playerState || !enemyState) {
    return (
      <section className={styles.empty}>
        É necessário ter personagem e criatura disponíveis.
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
  const usedBasic = actionUsage.basic;
  const usedClass = actionUsage.classSkill;
  const usedRace = actionUsage.raceSkill;
  const usedItem = actionUsage.item;
  const actionAvailability = getTacticalActionAvailability({
    outcome,
    usage: actionUsage,
    restrictions: {
      stunned: playerStun > 0,
      silenced: playerSilence > 0,
      feared: playerFear > 0,
      rooted: playerRoot > 0,
    },
    hasItem: character.items.length > 0,
  });

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
    setActionUsage(resetTacticalActionUsage());
    clearAction();
  }

  function resetBoard(nextCharacter = character, nextCreature = creature) {
    settledOutcome.current = null;
    setSettlement(null);
    setPlayerPosition(tacticalMap.playerStart);
    setEnemyPosition(tacticalMap.enemyStart);
    setPlayerState(makePlayer(nextCharacter));
    setEnemyState(makeCreature(nextCreature));
    setClassTracker(initialTacticalClassResourceTracker);
    setPathTracker(initialTacticalPathTracker);
    resetTurnActions();
    setRound(1);
    setLog([
      `Mapa reiniciado: ${tacticalMap.name}.`,
      `${nextCharacter.name} vs ${nextCreature.name}.`,
    ]);
    setMessage(`${tacticalMap.name} reiniciado.`);
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
    if (finished)
      return setMessage(
        getTacticalCombatOutcomeMessage({
          outcome,
          playerName: player.name,
          enemyName: enemy.name,
        }),
      );
    if (playerStun > 0) return setMessage(`STUN: você não pode agir por ${playerStun} turno(s).`);
    if (next.kind === "basic") {
      if (playerFear > 0)
        return setMessage(`FEAR: ações ofensivas bloqueadas por ${playerFear} turno(s).`);
      if (usedBasic) return setMessage("Ataque Básico já usado neste turno.");
    } else {
      if (playerSilence > 0)
        return setMessage(`SILENCE: habilidades bloqueadas por ${playerSilence} turno(s).`);
      if (playerFear > 0 && affectsEnemy(next.skill))
        return setMessage("FEAR: habilidade ofensiva bloqueada.");
      if (sourceUsed(next.source))
        return setMessage(
          `Habilidade de ${next.source === "class" ? "Classe" : "Raça"} já usada neste turno.`,
        );
      const cooldown = player.cooldowns[next.skill.key] ?? 0;
      if (cooldown > 0)
        return setMessage(`${next.name} está em cooldown por ${cooldown} turno(s).`);
    }
    setAction(next);
    setAreaCenter(null);
    setMessage(`${next.name} selecionado.`);
  }

  function executePlayerSkill(
    selected: Extract<PlayerAction, { kind: "skill" }>,
    center: TacticalPosition,
  ) {
    if (finished)
      return setMessage(
        getTacticalCombatOutcomeMessage({
          outcome,
          playerName: player.name,
          enemyName: enemy.name,
        }),
      );
    if (playerStun > 0) return setMessage("STUN impede a habilidade.");
    if (playerSilence > 0) return setMessage("SILENCE impede a habilidade.");
    if (playerFear > 0 && affectsEnemy(selected.skill))
      return setMessage("FEAR impede a habilidade ofensiva.");

    if (selected.area > 0 && affectsEnemy(selected.skill)) {
      const affected = getTacticalAreaCells({ center, radius: selected.area, grid });
      if (!affected.has(tacticalPositionKey(enemyPosition)))
        return setMessage(`A área não atingiu ${creature.name}.`);
    }

    const firstAction = isFirstAction(usedBasic, usedClass, usedRace, usedItem);
    const targetDistance = affectsEnemy(selected.skill)
      ? getTacticalDistance(playerPosition, enemyPosition)
      : 0;
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
          grid,
        });
    const dealtDamage = Math.max(
      0,
      totalDurability(beforeEnemy) - totalDurability(damageTraits.target),
    );
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
    setActionUsage((current) =>
      markTacticalActionUsed(current, selected.source === "class" ? "classSkill" : "raceSkill"),
    );

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
      return setMessage(
        getTacticalCombatOutcomeMessage({
          outcome,
          playerName: player.name,
          enemyName: enemy.name,
        }),
      );
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
        addLog(
          `Rodada ${round}: ${player.name} moveu ${cost} casa(s), de ${playerPosition.x + 1},${playerPosition.y + 1} para ${position.x + 1},${position.y + 1}.`,
        );
      }
      setMessage(`Movimento: ${cost} ponto(s) consumido(s).`);
      return;
    }

    if (playerStun > 0) return setMessage("STUN impede a ação.");
    if (obstacles.has(key)) return setMessage("Essa casa está bloqueada.");
    const distance = getTacticalDistance(playerPosition, position);
    if (distance > action.range)
      return setMessage(`${action.name}: fora do alcance (${distance}/${action.range}).`);

    if (action.kind === "basic") {
      if (playerFear > 0) return setMessage("FEAR impede o ataque.");
      if (key !== tacticalPositionKey(enemyPosition))
        return setMessage(`Selecione ${creature.name}.`);
      const sight = hasTacticalLineOfSight({
        from: playerPosition,
        to: enemyPosition,
        blocked: obstacles,
      });
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
      const reactions =
        resistanceResult.target.hp <= 0
          ? {
              actor: result.actor,
              target: resistanceResult.target,
              dealtDamage: result.event.amount,
              messages: [] as string[],
            }
          : applyTacticalBasicAttackReactions({
              actorBefore: player,
              targetBefore: beforeEnemy,
              actorAfter: result.actor,
              targetAfter: resistanceResult.target,
              damageType: character.basicAttackDamageType,
              distance: getTacticalDistance(playerPosition, enemyPosition),
              firstSuccessfulActionThisRound: isFirstAction(
                usedBasic,
                usedClass,
                usedRace,
                usedItem,
              ),
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
      setActionUsage((current) => markTacticalActionUsed(current, "basic"));
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
    const sight = hasTacticalLineOfSight({
      from: playerPosition,
      to: position,
      blocked: obstacles,
    });
    if (targetsEnemy && !sight && !tacticalPathIgnoresLineOfSight(character.classPathKey, enemy)) {
      return setMessage(`${action.name}: linha de visão bloqueada.`);
    }
    if (
      action.area > 0 &&
      (!areaCenter || tacticalPositionKey(areaCenter) !== tacticalPositionKey(position))
    ) {
      setAreaCenter(position);
      setMessage(
        `${action.name}: área ${action.area} destacada. Clique novamente no centro para confirmar.`,
      );
      return;
    }
    executePlayerSkill(action, position);
  }

  function consumeItem(item: TacticalItem) {
    if (usedItem || finished) return;
    if (playerStun > 0) return setMessage("STUN impede uso de item.");
    const healed = Math.min(
      Math.max(25, Math.round(player.maxHp * 0.25)),
      player.maxHp - player.hp,
    );
    if (healed <= 0) return setMessage("Seu HP já está cheio.");
    let nextPlayer: CombatantState = { ...player, hp: player.hp + healed };
    const reaction = applyTacticalRacialReaction(nextPlayer, nextPlayer.raceResourceName, {
      firstSuccessfulActionThisRound: isFirstAction(usedBasic, usedClass, usedRace, usedItem),
    });
    nextPlayer = reaction.combatant;
    const itemDoctrine = consumeTacticalPathItemAction(character.classPathKey, pathTracker);
    setPathTracker(itemDoctrine.tracker);
    setPlayerState(nextPlayer);
    if (itemDoctrine.consumeAction)
      setActionUsage((current) => markTacticalActionUsed(current, "item"));
    const text = `${player.name} usou ${item.name} e recuperou ${healed} HP.${reaction.message ? ` ${reaction.message}` : ""}${itemDoctrine.message ? ` ${itemDoctrine.message}` : ""}`;
    setMessage(text);
    addLog(text);
  }

  function applyIncomingClassGeneration(
    before: CombatantState,
    after: CombatantState,
    tracker: TacticalClassResourceTracker,
  ) {
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
      setMessage(
        getTacticalCombatOutcomeMessage({
          outcome,
          playerName: player.name,
          enemyName: enemy.name,
        }),
      );
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
    if (prepared.messages.length) {
      notes.push(...prepared.messages.map((entry) => `${player.name}: ${entry}`));
    }

    const periodicOutcome = getTacticalCombatOutcome(nextPlayer, nextEnemy);
    if (isTacticalCombatFinished(periodicOutcome)) {
      const endText = getTacticalCombatOutcomeMessage({
        outcome: periodicOutcome,
        playerName: nextPlayer.name,
        enemyName: nextEnemy.name,
      });
      setPlayerState(nextPlayer);
      setEnemyState(nextEnemy);
      clearAction();
      notes.forEach(addLog);
      addLog(endText);
      setMessage(`${notes.join(" ")} ${endText}`);
      return;
    }

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
          grid,
          blocked: obstacles,
        });
        nextEnemyPosition = flee.position;
        notes.push(
          flee.movementCost > 0
            ? `${creature.name} fugiu ${flee.movementCost} casa(s).`
            : "Sem rota de fuga.",
        );
      }
      notes.push("FEAR bloqueou a ação ofensiva da criatura.");
    } else {
      const planningRange = getCreaturePlanningSkillRange({
        skills: creatureSkills,
        cooldowns: nextEnemy.cooldowns,
        profile: profile.aiProfile,
        fallbackRange: profile.basicAttackRange,
      });
      const hasReadySkill =
        currentEnemySilence <= 0 &&
        creatureSkills.some((skill) => (nextEnemy.cooldowns[skill.key] ?? 0) <= 0);

      if (currentEnemyRoot <= 0) {
        const decision = chooseTacticalProfileDestination({
          profile: profile.aiProfile,
          start: nextEnemyPosition,
          target: nextPlayerPosition,
          movement: profile.movement,
          grid,
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
      const sight = hasTacticalLineOfSight({
        from: nextEnemyPosition,
        to: nextPlayerPosition,
        blocked: obstacles,
      });
      const selectedEnemySkill =
        sight && currentEnemySilence <= 0
          ? chooseCreatureTacticalSkill({
              skills: creatureSkills,
              cooldowns: nextEnemy.cooldowns,
              distance,
              profile: profile.aiProfile,
            })
          : null;
      if (currentEnemyTaunt)
        notes.push(`TAUNT ativo: alvo obrigatório ${currentEnemyTaunt.targetId}.`);

      if (selectedEnemySkill) {
        const beforePlayer = nextPlayer;
        const result = resolveTacticalSkill(nextEnemy, nextPlayer, selectedEnemySkill, undefined, {
          distance,
        });
        nextEnemy = result.actor;
        const incomingClass = applyIncomingClassGeneration(
          beforePlayer,
          result.target,
          nextTracker,
        );
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
        notes.push(
          `${result.event.message}${incomingClass.message ? ` ${incomingClass.message}` : ""}${incomingPath.messages.length ? ` ${incomingPath.messages.join(" ")}` : ""}`,
        );

        if (nextPlayer.hp > 0) {
          const successful = new Set(result.successfulOperationIndexes);
          const pushEntry = selectedEnemySkill.operations.findIndex(
            (operation) => operation.operation === "PUSH",
          );
          if (pushEntry >= 0 && successful.has(pushEntry)) {
            const push = selectedEnemySkill.operations[pushEntry];
            const forced = getForcedMovementDestination({
              source: nextEnemyPosition,
              target: nextPlayerPosition,
              distance: Math.max(1, push.distance || 1),
              blocked: new Set([...obstacles, tacticalPositionKey(nextEnemyPosition)]),
              grid,
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
          const reactions =
            result.target.hp <= 0
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
          const incomingClass = applyIncomingClassGeneration(
            beforePlayer,
            reactions.target,
            nextTracker,
          );
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
          notes.push(
            currentEnemySilence > 0
              ? "SILENCE: IA recorreu ao Ataque Básico."
              : "IA usou Ataque Básico.",
          );
          notes.push(
            `${result.event.message}${reactions.messages.length ? ` ${reactions.messages.join(" ")}` : ""}${incomingClass.message ? ` ${incomingClass.message}` : ""}${incomingPath.messages.length ? ` ${incomingPath.messages.join(" ")}` : ""}`,
          );
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
    if (completed.messages.length) {
      notes.push(...completed.messages.map((entry) => `${enemy.name}: ${entry}`));
    }
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

  return (
    <section className={styles.lab} aria-label="Combate tático" data-tactical-core>
      <CombatFeedbackLayer
        message={message}
        iconUrls={[
          character.basicAttack.iconUrl,
          ...character.skills.map(({ skill }) => skill.iconUrl),
          ...character.passives.map((passive) => passive.iconUrl),
        ]}
      />
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Combate tático · Rework</span>
          <h1>{tacticalMap.name}</h1>
          <p>
            {tacticalMap.description} Grade {grid.width}×{grid.height}, com{" "}
            {tacticalMap.obstacles.length} obstáculos.
          </p>
        </div>
        <div className={styles.status}>
          <small>{finished ? "Finalizado" : "Em combate"}</small>
          <strong>Rodada {round}</strong>
        </div>
      </header>

      <section className={styles.characterPanel} data-wl-surface="raised">
        <label>
          <span>Personagem</span>
          <select
            disabled={locked}
            value={character.id}
            onChange={(event) => changeCharacter(event.target.value)}
          >
            {characters.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name} · Rank {entry.rank} · {entry.className}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Criatura do Bestiário</span>
          <select
            disabled={locked}
            value={creature.id}
            onChange={(event) => changeCreature(event.target.value)}
          >
            {creatures.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name} · Rank {entry.rank} · {entry.combatProfile.aiProfile}
              </option>
            ))}
          </select>
        </label>
        <div className={styles.characterSummary}>
          <strong>{character.name}</strong>
          <span>
            {character.raceName} · {character.className} · Rank {character.rank}
          </span>
          <span>Caminho: {character.classPathKey ?? "não escolhido"}</span>
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
          <div className={styles.bar}>
            <i style={{ width: `${percent(player.hp, player.maxHp)}%` }} />
          </div>
          <span>
            HP {player.hp}/{player.maxHp}
          </span>
          {player.maxMana > 0 ? (
            <span>
              Mana {player.mana}/{player.maxMana}
            </span>
          ) : null}
          {player.maxClassResource > 0 ? (
            <span>
              {player.classResourceName} {player.classResource}/{player.maxClassResource}
            </span>
          ) : null}
          {player.maxRaceResource > 0 ? (
            <span>
              {player.raceResourceName} {player.raceResource}/{player.maxRaceResource}
            </span>
          ) : null}
          {playerRoot > 0 ? <span>ROOT: {playerRoot}</span> : null}
          {playerStun > 0 ? <span>STUN: {playerStun}</span> : null}
          {playerSilence > 0 ? <span>SILENCE: {playerSilence}</span> : null}
          {playerFear > 0 ? <span>FEAR: {playerFear}</span> : null}
          {playerTaunt ? <span>TAUNT: {playerTaunt.turns}</span> : null}
          <CombatStatusDock fighter={player} />
        </article>
        <article data-enemy="true">
          <small>BESTIÁRIO · RANK {creature.rank}</small>
          <strong>{creature.name}</strong>
          <div className={styles.bar}>
            <i style={{ width: `${percent(enemy.hp, enemy.maxHp)}%` }} />
          </div>
          <span>
            HP {enemy.hp}/{enemy.maxHp}
          </span>
          <span>
            IA {profile.aiProfile} · Movimento {profile.movement} · Alcance básico{" "}
            {profile.basicAttackRange}
          </span>
          <span>
            Fraquezas: {creature.weaknesses.length ? creature.weaknesses.join(" · ") : "nenhuma"}
          </span>
          <span>
            Resistências: {profile.resistances.length ? profile.resistances.join(" · ") : "nenhuma"}
          </span>
          {enemyRoot > 0 ? <span>ROOT: {enemyRoot}</span> : null}
          {enemyStun > 0 ? <span>STUN: {enemyStun}</span> : null}
          {enemySilence > 0 ? <span>SILENCE: {enemySilence}</span> : null}
          {enemyFear > 0 ? <span>FEAR: {enemyFear}</span> : null}
          {enemyTaunt ? <span>TAUNT: {enemyTaunt.turns}</span> : null}
          <CombatStatusDock fighter={enemy} />
        </article>
      </section>

      <div className={styles.toolbar} data-wl-surface="raised">
        <button
          type="button"
          disabled={!actionAvailability.movement || movement <= 0}
          onClick={() => {
            clearAction();
            setMessage(`Movimento: ${movement}/${PLAYER_MOVE}.`);
          }}
        >
          Movimento · {movement}/{PLAYER_MOVE}
        </button>
        <button
          type="button"
          disabled={!actionAvailability.basic}
          data-wl-action={action?.kind === "basic" ? "primary" : undefined}
          onClick={() =>
            selectAction({
              kind: "basic",
              name: "Ataque Básico",
              range: character.basicAttackRange,
              area: 0,
            })
          }
        >
          Ataque · {usedBasic ? "USADO" : playerFear > 0 ? "BLOQUEADO" : "DISPONÍVEL"}
        </button>
        <button type="button" disabled={!actionAvailability.endTurn} onClick={executeEnemyTurn}>
          Encerrar turno → IA
        </button>
        <button type="button" disabled={locked || settling} onClick={() => resetBoard()}>
          Reiniciar
        </button>
      </div>

      {settling || settlement ? (
        <p role="status">{settling ? "Registrando resultado..." : settlement}</p>
      ) : null}

      <div className={styles.skillBar} data-wl-surface="raised">
        <button
          type="button"
          className={styles.actionTile}
          disabled={!actionAvailability.movement || movement <= 0}
          data-action-kind="movement"
          onClick={() => {
            clearAction();
            setMessage(`Movimento: ${movement}/${PLAYER_MOVE}.`);
          }}
        >
          <span className={styles.fallbackIcon} aria-hidden="true">
            ✥
          </span>
          <strong>Mover</strong>
          <small>Alcance {movement}</small>
        </button>
        <button
          type="button"
          className={styles.actionTile}
          disabled={!actionAvailability.basic}
          data-selected={action?.kind === "basic" ? "true" : "false"}
          data-action-kind="basic"
          onClick={() =>
            selectAction({
              kind: "basic",
              name: character.basicAttack.name,
              range: character.basicAttackRange,
              area: 0,
            })
          }
        >
          {character.basicAttack.iconUrl ? (
            <Image
              src={character.basicAttack.iconUrl}
              alt=""
              width={62}
              height={62}
              className={styles.skillIcon}
            />
          ) : (
            <span className={styles.fallbackIcon} aria-hidden="true">
              ⚔
            </span>
          )}
          <strong>{character.basicAttack.name}</strong>
          <small>{usedBasic ? "Usado" : `Alcance ${character.basicAttackRange}`}</small>
        </button>
        {character.passives.map((passive) => (
          <button
            key={`${passive.source}-${passive.key}`}
            type="button"
            className={styles.passiveTile}
            disabled
            title={passive.description}
          >
            {passive.iconUrl ? (
              <Image
                src={passive.iconUrl}
                alt=""
                width={62}
                height={62}
                className={styles.skillIcon}
              />
            ) : (
              <span className={styles.fallbackIcon} aria-hidden="true">
                ◆
              </span>
            )}
            <strong>{passive.name}</strong>
            <small>
              {passive.source === "class" ? "Passiva de classe" : "Característica racial"}
            </small>
          </button>
        ))}
        {character.skills.map(({ source, skill }) => {
          const cooldown = player.cooldowns[skill.key] ?? 0;
          const blocked =
            !actionAvailability[source === "class" ? "classSkill" : "raceSkill"] ||
            cooldown > 0 ||
            playerSkillBlocked ||
            (playerFear > 0 && affectsEnemy(skill)) ||
            finished;
          return (
            <button
              key={`${source}-${skill.key}`}
              type="button"
              disabled={blocked}
              data-selected={
                action?.kind === "skill" && action.skill.key === skill.key ? "true" : "false"
              }
              onClick={() =>
                selectAction({
                  kind: "skill",
                  name: skill.name,
                  range: skill.range,
                  area: skill.area,
                  source,
                  skill,
                })
              }
            >
              {skill.iconUrl ? (
                <Image
                  src={skill.iconUrl}
                  alt=""
                  width={62}
                  height={62}
                  className={styles.skillIcon}
                />
              ) : (
                <span className={styles.fallbackIcon} aria-hidden="true">
                  ◆
                </span>
              )}
              <strong>{skill.name}</strong>
              <small>
                {cooldown > 0
                  ? `Cooldown ${cooldown}`
                  : `${source === "class" ? "Classe" : "Raça"} · Alcance ${skill.range}${skill.area ? ` · Área ${skill.area}` : ""}`}
              </small>
            </button>
          );
        })}
        {character.items.map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={!actionAvailability.item}
            onClick={() => consumeItem(item)}
          >
            <strong>{item.name}</strong>
            <span>Item ativo · 1 por turno</span>
            <small>{usedItem ? "USADO" : "DISPONÍVEL"}</small>
          </button>
        ))}
      </div>

      <div className={styles.workspace}>
        <div className={styles.boardShell} data-wl-surface="dark">
          <div
            className={styles.board}
            style={{
              aspectRatio: `${grid.width} / ${grid.height}`,
              gridTemplateColumns: `repeat(${grid.width}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${grid.height}, minmax(0, 1fr))`,
            }}
          >
            {cells.map((position) => {
              const key = tacticalPositionKey(position);
              const isPlayer = key === tacticalPositionKey(playerPosition);
              const isEnemy = key === tacticalPositionKey(enemyPosition);
              const isObstacle = obstacles.has(key);
              const isReachable = !finished && !action && playerStun <= 0 && reachable.has(key);
              const inRange = Boolean(
                !finished &&
                action &&
                playerStun <= 0 &&
                getTacticalDistance(playerPosition, position) <= action.range,
              );
              const isArea = !finished && areaCells.has(key);
              const rangeState = action?.kind === "basic" ? "attack-range" : "ability-range";
              const state = isPlayer
                ? "player"
                : isEnemy
                  ? "enemy"
                  : isObstacle
                    ? "obstacle"
                    : isArea
                      ? "area"
                      : isReachable
                        ? "reachable"
                        : inRange
                          ? rangeState
                          : "empty";
              return (
                <button
                  key={key}
                  type="button"
                  disabled={finished}
                  className={styles.cell}
                  data-state={state}
                  onClick={() => clickCell(position)}
                  aria-label={
                    isPlayer
                      ? player.name
                      : isEnemy
                        ? creature.name
                        : isObstacle
                          ? "Obstáculo"
                          : `Casa ${position.x + 1}, ${position.y + 1}`
                  }
                >
                  {isPlayer ? <span className={styles.unit}>♞</span> : null}
                  {isEnemy ? <span className={styles.unit}>♜</span> : null}
                  {isObstacle ? <span className={styles.obstacle}>◆</span> : null}
                </button>
              );
            })}
          </div>
          <div className={styles.boardLegend} aria-label="Legenda do tabuleiro">
            <span data-kind="movement">Movimento</span>
            <span data-kind="attack">Ataque</span>
            <span data-kind="ability">Habilidade</span>
            <span data-kind="area">Área</span>
          </div>
        </div>
        <aside className={styles.sidePanel} data-wl-surface="raised">
          <div>
            <span className={styles.eyebrow}>Economia do turno</span>
            <h2>1 + 1 + 1 + 1</h2>
          </div>
          <ul>
            <li>
              Mapa: {tacticalMap.name} · {grid.width}×{grid.height}
            </li>
            <li>Resultado: {outcome}</li>
            <li>Ataque Básico: {usedBasic ? "usado" : "disponível"}</li>
            <li>Classe: {usedClass ? "usada" : "disponível"}</li>
            <li>Raça: {usedRace ? "usada" : "disponível"}</li>
            <li>Item: {character.items.length ? (usedItem ? "usado" : "disponível") : "nenhum"}</li>
            <li>Doutrina: {character.classPathKey ?? "nenhuma"}</li>
            <li>IA: {profile.aiProfile}</li>
            <li>Skills da criatura: {creatureSkills.map((skill) => skill.name).join(" · ")}</li>
          </ul>
          <p className={styles.message} role="status">
            {message}
          </p>
          <div className={styles.combatLog}>
            <small>REGISTRO DE AÇÕES</small>
            {log.map((entry, index) => (
              <p key={`${index}-${entry}`}>{entry}</p>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
