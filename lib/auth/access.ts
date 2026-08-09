import type { UserRole } from "@/lib/db/types";

export type AccountAreaKey = "profile" | "characters" | "new-character" | "arena" | "admin";

export interface AccountArea {
  key: AccountAreaKey;
  label: string;
  shortLabel: string;
  description: string;
  href: string;
  glyph: string;
  access: "authenticated" | "administrative";
  navigation: boolean;
}

export const accountAreas: readonly AccountArea[] = [
  {
    key: "profile",
    label: "Minha conta",
    shortLabel: "Minha conta",
    description: "Consulte seu cargo, dados da conta e resumo dos personagens.",
    href: "/perfil",
    glyph: "ID",
    access: "authenticated",
    navigation: true,
  },
  {
    key: "characters",
    label: "Meus personagens",
    shortLabel: "Personagens",
    description: "Abra suas fichas, o Grimório e o inventário de cada personagem.",
    href: "/personagens",
    glyph: "PJ",
    access: "authenticated",
    navigation: true,
  },
  {
    key: "new-character",
    label: "Criar personagem",
    shortLabel: "Nova ficha",
    description: "Escolha raça e classe e distribua os 100 pontos da nova ficha.",
    href: "/personagens/novo",
    glyph: "+",
    access: "authenticated",
    navigation: false,
  },
  {
    key: "arena",
    label: "Arena de Testes",
    shortLabel: "Arena",
    description: "Teste ataques, habilidades, Mana, recargas e equipamentos por turnos.",
    href: "/arena",
    glyph: "AR",
    access: "authenticated",
    navigation: true,
  },
  {
    key: "admin",
    label: "Painel ADM",
    shortLabel: "Painel ADM",
    description: "Gerencie raças, classes, itens e as regras oficiais do Wonderland.",
    href: "/admin",
    glyph: "ADM",
    access: "administrative",
    navigation: true,
  },
] as const;

export function isAdministrativeRole(role: UserRole) {
  return role === "admin" || role === "founder";
}

export function canAccessAccountArea(role: UserRole, area: AccountArea) {
  return area.access === "authenticated" || isAdministrativeRole(role);
}

export function getAccessibleAccountAreas(role: UserRole) {
  return accountAreas.filter((area) => canAccessAccountArea(role, area));
}

export function getAccountNavigation(role: UserRole) {
  return getAccessibleAccountAreas(role).filter((area) => area.navigation);
}
