import Link from "next/link";

import { getCurrentAccount } from "@/lib/auth/account";
import { isAdministrativeRole } from "@/lib/auth/roles";

import styles from "./admin-tactical-access.module.css";

export async function AdminTacticalAccess({
  variant = "fixed",
}: {
  variant?: "fixed" | "inline";
}) {
  const account = await getCurrentAccount();

  if (!account || !isAdministrativeRole(account.role)) return null;

  const className = variant === "inline" ? `${styles.access} ${styles.inline}` : styles.access;

  return (
    <Link className={className} href="/arena/mapa-tatico" aria-label="Abrir laboratório administrativo do mapa tático">
      <span className={styles.badge}>ADM</span>
      <span>
        <small>Laboratório administrativo</small>
        <strong>Mapa Tático</strong>
      </span>
      <b>{variant === "inline" ? "Abrir laboratório →" : "→"}</b>
    </Link>
  );
}
