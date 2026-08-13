export const rangedClasses = new Set([
  "Arqueiro",
  "Mago",
  "Feiticeiro",
  "Bruxo",
  "Clérigo",
  "Druida",
  "Bardo",
  "Alquimista",
  "Necromante",
]);
export function getClassBasicAttackRange(className: string) {
  return rangedClasses.has(className) ? 3 : 1;
}
