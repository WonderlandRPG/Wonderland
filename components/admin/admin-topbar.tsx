"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { CurrentAccount } from "@/lib/auth/roles";
import { roleLabels } from "@/lib/auth/roles";

function getRouteHeading(pathname: string) {
  if (pathname === "/admin") {
    return { path: "Wonderland / Administração / Núcleo", title: "Central de comando" };
  }

  if (pathname === "/admin/racas") {
    return { path: "Wonderland / Conteúdo do jogo / Raças", title: "Catálogo de raças" };
  }

  if (pathname === "/admin/racas/nova") {
    return { path: "Wonderland / Raças / Nova", title: "Criar raça" };
  }

  if (pathname.endsWith("/preview")) {
    return { path: "Wonderland / Raças / Pré-visualização", title: "Prévia da raça" };
  }

  return { path: "Wonderland / Raças / Editor", title: "Editar raça" };
}

export function AdminTopbar({
  account,
  configured,
}: {
  account: CurrentAccount;
  configured: boolean;
}) {
  const pathname = usePathname();
  const heading = getRouteHeading(pathname);
  const initials = account.displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <header className="admin-topbar">
      <div>
        <span className="admin-topbar__path">{heading.path}</span>
        <h1>{heading.title}</h1>
      </div>
      <div className="admin-topbar__actions">
        <span className={`connection-status ${configured ? "is-online" : "is-pending"}`}>
          <span className="signal-dot" />
          {configured ? "Supabase conectado" : "Supabase aguardando conexão"}
        </span>
        <Link className="admin-profile" href="/perfil">
          <span>{initials || "W"}</span>
          <span>
            <strong>{account.displayName}</strong>
            <small>{roleLabels[account.role]}</small>
          </span>
        </Link>
      </div>
    </header>
  );
}
