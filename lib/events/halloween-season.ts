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
