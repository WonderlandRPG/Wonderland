"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SignOutButton } from "@/components/account/sign-out-button";
import { BrandMark } from "@/components/brand-mark";
import type { CurrentAccount } from "@/lib/auth/roles";
import { roleLabels } from "@/lib/auth/roles";

const navigation = [
  { group: "Comando", items: [{ label: "Visão geral", glyph: "01", href: "/admin" }] },
  {
    group: "Comunidade",
    items: [
      { label: "Tela principal", glyph: "◈", href: "/admin/portal" },
      { label: "Publicar evento", glyph: "＋", href: "/admin/eventos#novo-evento" },
      { label: "Publicar atualização", glyph: "＋", href: "/admin/atualizacoes#nova-atualizacao" },
      { label: "Jogadores", glyph: "02", href: "/admin/jogadores" },
      { label: "Personagens", glyph: "03", href: "/admin/personagens" },
      { label: "Console de recompensas", glyph: ">_", href: "/admin/console" },
    ],
  },
  {
    group: "Jogo e economia",
    items: [
      { label: "Raças", glyph: "04", href: "/admin/racas" },
      { label: "Classes", glyph: "CL", href: "/admin/classes" },
      { label: "Chat de conteúdo", glyph: "AI", href: "/admin/importar" },
      { label: "Itens", glyph: "05", href: "/admin/itens" },
      { label: "Missões", glyph: "✥", href: "/admin/missoes" },
      { label: "Títulos", glyph: "✦", href: "/admin/titulos" },
      { label: "Balanceamento", glyph: "06", href: "/admin/balanceamento" },
      { label: "Presença", glyph: "07", href: "/admin/presenca" },
      { label: "Temas", glyph: "◐", href: "/admin/temas" },
    ],
  },
  { group: "Auditoria", items: [{ label: "Histórico", glyph: "08", href: "/admin/historico" }] },
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
        {navigation.map((section) => (
          <div className="admin-sidebar__nav-group" key={section.group}>
            <span className="admin-sidebar__nav-label">{section.group}</span>
            {section.items.map((item) => {
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
          </div>
        ))}
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
        {pathname.startsWith("/admin/classes") ? (
          <div className="admin-sidebar__subnav">
            <Link className="is-active" href="/admin/classes">
              <span>CL</span>Classes
            </Link>
            <Link href="/admin/classes/nova">
              <span>＋</span>Nova classe
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
