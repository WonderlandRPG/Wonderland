import Link from "next/link";

import { getCurrentAccount } from "@/lib/auth/account";
import { isAdministrativeRole } from "@/lib/auth/roles";

import styles from "./admin-tactical-access.module.css";

export async function AdminTacticalAccess() {
  const account = await getCurrentAccount();

  if (!account || !isAdministrativeRole(account.role)) return null;

  return (
    <Link className={styles.access} href="/arena/mapa-tatico" aria-label="Abrir laboratório administrativo do mapa tático">
      <span className={styles.badge}>ADM</span>
      <span>
        <small>Laboratório</small>
        <strong>Mapa Tático</strong>
      </span>
      <b>→</b>
    </Link>
  );
}
