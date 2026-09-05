import thresholds from "@/lib/game/official-experience.json";

export const officialExperience = thresholds as readonly number[];

export function getLevelFromExperience(xp: number) {
  const safeXp = Math.max(0, Math.floor(xp));
  let level = 1;
  for (let index = 0; index < officialExperience.length; index += 1) {
    if (safeXp < officialExperience[index]) break;
    level = index + 1;
  }
  return Math.min(100, level);
}

export function getLevelProgress(xp: number) {
  const level = getLevelFromExperience(xp);
  const current = officialExperience[level - 1];
  const next = officialExperience[level] ?? current;
  return {
    level,
    current,
    next,
    percent: level === 100 ? 100 : Math.max(0, Math.min(100, ((Math.max(0, xp) - current) / (next - current)) * 100)),
  };
}
