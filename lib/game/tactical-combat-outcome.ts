export type TacticalCombatOutcome = "ongoing" | "victory" | "defeat" | "draw";

export type TacticalCombatantVitalState = {
  hp: number;
};

export function getTacticalCombatOutcome(
  player: TacticalCombatantVitalState,
  enemy: TacticalCombatantVitalState,
): TacticalCombatOutcome {
  const playerDefeated = player.hp <= 0;
  const enemyDefeated = enemy.hp <= 0;

  if (playerDefeated && enemyDefeated) return "draw";
  if (enemyDefeated) return "victory";
  if (playerDefeated) return "defeat";
  return "ongoing";
}

export function isTacticalCombatFinished(outcome: TacticalCombatOutcome) {
  return outcome !== "ongoing";
}

export function canTacticalPlayerAct(outcome: TacticalCombatOutcome) {
  return outcome === "ongoing";
}

export function shouldStartNextTacticalRound(outcome: TacticalCombatOutcome) {
  return outcome === "ongoing";
}

export function getTacticalCombatOutcomeMessage({
  outcome,
  playerName,
  enemyName,
}: {
  outcome: TacticalCombatOutcome;
  playerName: string;
  enemyName: string;
}) {
  switch (outcome) {
    case "victory":
      return `${enemyName} foi derrotado. ${playerName} venceu o combate.`;
    case "defeat":
      return `${playerName} foi derrotado por ${enemyName}.`;
    case "draw":
      return `${playerName} e ${enemyName} foram derrotados. O combate terminou em empate.`;
    default:
      return "O combate continua.";
  }
}
