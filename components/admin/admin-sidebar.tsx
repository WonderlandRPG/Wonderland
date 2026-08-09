"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SignOutButton } from "@/components/account/sign-out-button";
import { BrandMark } from "@/components/brand-mark";
import type { CurrentAccount } from "@/lib/auth/roles";
import { roleLabels } from "@/lib/auth/roles";

const navigation = [
  { label: "Visão geral", glyph: "01", href: "/admin" },
  { label: "Conteúdo do jogo", glyph: "02", href: "/admin/racas" },
  { label: "Balanceamento", glyph: "03", href: "/admin/balanceamento" },
  { label: "Jogadores", glyph: "04", href: "/admin/jogadores" },
  { label: "Histórico", glyph: "05", href: "/admin/historico" },
  { label: "Eventos", glyph: "06", href: "/admin/eventos" },
  { label: "Atualizações", glyph: "07", href: "/admin/atualizacoes" },
];

export function AdminSidebar({ account }: { account: CurrentAccount }) {
  const pathname = usePathname();

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
        {pathname.startsWith("/admin/racas") ? (
          <div className="admin-sidebar__subnav">
            <Link className="is-active" href="/admin/racas">
              <span>RA</span>
              Raças
            </Link>
            <Link href="/admin/racas/nova">
              <span>＋</span>
              Nova raça
            </Link>
          </div>
        ) : null}
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
