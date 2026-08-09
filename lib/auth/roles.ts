import type { UserRole } from "@/lib/db/types";

import { isAdministrativeRole } from "@/lib/auth/access";

export interface CurrentAccount {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: UserRole;
  createdAt: string;
}

export const roleLabels: Record<UserRole, string> = {
  player: "Jogador",
  moderator: "Moderador",
  admin: "Administrador",
  founder: "Fundador",
};

export { isAdministrativeRole };
