const SAO_PAULO_TIME_ZONE = "America/Sao_Paulo";
const HALLOWEEN_START_DATE = 20261007;
const HALLOWEEN_END_DATE = 20261031;

function saoPauloDateKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SAO_PAULO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return Number(`${value.year}${value.month}${value.day}`);
}

export function isHalloweenSeasonActive(date = new Date()) {
  const dateKey = saoPauloDateKey(date);
  return dateKey >= HALLOWEEN_START_DATE && dateKey <= HALLOWEEN_END_DATE;
}

export function getHalloweenEventProgress(date = new Date()) {
  const dateKey = saoPauloDateKey(date);
  const day = dateKey % 100;
  // Each preparation day counts once: October 8 is day 1 of 23, October 30 is day 23.
  const percent =
    dateKey < 20261008 ? 0 : dateKey >= 20261030 ? 100 : Math.round(((day - 7) / 23) * 100);
  return { percent, active: dateKey >= 20261008 && dateKey <= HALLOWEEN_END_DATE };
}
