"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SignOutButton } from "@/components/account/sign-out-button";
import { BrandMark } from "@/components/brand-mark";
import { getAccountNavigation } from "@/lib/auth/access";
import type { CurrentAccount } from "@/lib/auth/roles";
import { roleLabels } from "@/lib/auth/roles";

const navigation = [
  { label: "Visão geral", glyph: "01", href: "/admin" },
  { label: "Conteúdo do jogo", glyph: "02", href: "/admin/racas" },
  { label: "Balanceamento", glyph: "03" },
  { label: "Jogadores", glyph: "04" },
  { label: "Histórico", glyph: "05" },
];

export function AdminSidebar({ account }: { account: CurrentAccount }) {
  const pathname = usePathname();
  const playerNavigation = getAccountNavigation(account.role).filter(
    (area) => area.key !== "admin",
  );

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar__brand">
        <BrandMark inverse />
        <span className="admin-sidebar__edition">Command OS / v2</span>
      </div>

      <nav className="admin-sidebar__nav" aria-label="Seções administrativas">
        <span className="admin-sidebar__nav-label">Núcleo de controle</span>
        {navigation.map((item) => {
          const active = item.href
            ? item.href === "/admin"
              ? pathname === item.href
              : pathname.startsWith(item.href)
            : false;

          if (!item.href) {
            return (
              <button
                className="admin-sidebar__nav-item"
                key={item.label}
                type="button"
                disabled
                title="Será ativado nas próximas etapas"
              >
                <span>{item.glyph}</span>
                {item.label}
              </button>
            );
          }

          return (
            <Link
              className={`admin-sidebar__nav-item ${active ? "is-active" : ""}`}
              href={item.href}
              key={item.label}
            >
              <span>{item.glyph}</span>
              {item.label}
            </Link>
          );
        })}
        {pathname.startsWith("/admin/racas") ||
        pathname.startsWith("/admin/classes") ||
        pathname.startsWith("/admin/itens") ? (
          <div className="admin-sidebar__subnav">
            <Link
              className={pathname.startsWith("/admin/racas") ? "is-active" : ""}
              href="/admin/racas"
            >
              <span>RA</span>
              Raças
            </Link>
            <Link
              className={pathname.startsWith("/admin/classes") ? "is-active" : ""}
              href="/admin/classes"
            >
              <span>CL</span>
              Classes
            </Link>
            <Link
              className={pathname.startsWith("/admin/itens") ? "is-active" : ""}
              href="/admin/itens"
            >
              <span>IT</span>
              Itens
            </Link>
          </div>
        ) : null}

        <span className="admin-sidebar__nav-label">Área do jogador</span>
        {playerNavigation.map((area) => (
          <Link className="admin-sidebar__nav-item" href={area.href} key={area.key}>
            <span>{area.glyph}</span>
            {area.shortLabel}
          </Link>
        ))}
      </nav>

      <div className="admin-sidebar__footer">
        <span className="signal-dot" />
        <div>
          <strong>{account.displayName}</strong>
          <small>{roleLabels[account.role]}</small>
        </div>
        <SignOutButton compact />
      </div>
    </aside>
  );
}
