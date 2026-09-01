const START_DATE = "2026-08-31";
const END_DATE = "2026-09-30";

export function getSaoPauloDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function isSeptemberYellowActive(date = new Date()) {
  const localDate = getSaoPauloDate(date);
  return localDate >= START_DATE && localDate <= END_DATE;
}
