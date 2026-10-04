"use client";

import Link from "next/link";
import styles from "./admin-navigation.module.css";
import { usePathname } from "next/navigation";

import { SignOutButton } from "@/components/account/sign-out-button";
import { BrandMark } from "@/components/brand-mark";
import type { CurrentAccount } from "@/lib/auth/roles";
import { roleLabels } from "@/lib/auth/roles";

const navigation = [
  {
    group: "Comando",
    items: [
      { label: "Visão geral", glyph: "01", href: "/admin" },
      { label: "Studio de itens e missões", glyph: "✦", href: "/admin/estudio" },
    ],
  },
  {
    group: "Comunidade",
    items: [
      { label: "Tela principal", glyph: "◈", href: "/admin/portal" },
      { label: "Histórias e contos", glyph: "✒", href: "/admin/historias" },
      { label: "Publicar evento", glyph: "＋", href: "/admin/eventos#novo-evento" },
      { label: "Publicar atualização", glyph: "＋", href: "/admin/atualizacoes#nova-atualizacao" },
      { label: "Jogadores", glyph: "02", href: "/admin/jogadores" },
      { label: "Personagens", glyph: "03", href: "/admin/personagens" },
      { label: "Salão de recompensas", glyph: "✦", href: "/admin/console" },
    ],
  },
  {
    group: "Jogo e economia",
    items: [
      { label: "Classes e raças · Rework", glyph: "✦", href: "/admin/migracao-rework" },
      { label: "Bestiário", glyph: "BS", href: "/admin/bestiario" },
      { label: "Itens", glyph: "05", href: "/admin/itens" },
      { label: "Cosméticos", glyph: "◇", href: "/admin/cosmeticos" },
      { label: "Missões", glyph: "✥", href: "/admin/missoes" },
      { label: "Controle de Reinos", glyph: "♛", href: "/admin/reinos" },
      { label: "Títulos", glyph: "✦", href: "/admin/titulos" },
      { label: "Balanceamento", glyph: "06", href: "/admin/balanceamento" },
      { label: "Temporadas", glyph: "♜", href: "/admin/temporadas" },
      { label: "Presença", glyph: "07", href: "/admin/presenca" },
      { label: "Temas", glyph: "◐", href: "/admin/temas" },
    ],
  },
  {
    group: "Auditoria",
    items: [
      { label: "Homologação", glyph: "✓", href: "/admin/homologacao" },
      { label: "Histórico", glyph: "08", href: "/admin/historico" },
    ],
  },
];

export function AdminSidebar({ account }: { account: CurrentAccount }) {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <BrandMark inverse />
        <span className={styles.edition}>Livro de Comando · v2</span>
      </div>

      <nav className={styles.nav} aria-label="Seções administrativas">
        {navigation.map((section) => (
          <div className={styles.group} key={section.group}>
            <span className={styles.label}>{section.group}</span>
            {section.items.map((item) => {
              const active =
                item.href === "/admin"
                  ? pathname === item.href
                  : pathname.startsWith(item.href.split("#")[0]);

              return (
                <Link
                  aria-current={active ? "page" : undefined}
                  className={styles.item}
                  href={item.href}
                  key={item.label}
                >
                  <span>{item.glyph}</span>
                  <b>{item.label}</b>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className={styles.footer}>
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
