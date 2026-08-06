import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";

const navigation = [
  { label: "Visão geral", glyph: "01", active: true },
  { label: "Conteúdo do jogo", glyph: "02", active: false },
  { label: "Balanceamento", glyph: "03", active: false },
  { label: "Jogadores", glyph: "04", active: false },
  { label: "Histórico", glyph: "05", active: false },
];

export function AdminSidebar() {
  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar__brand">
        <BrandMark inverse />
        <span className="admin-sidebar__edition">Command OS / v2</span>
      </div>

      <nav className="admin-sidebar__nav" aria-label="Seções administrativas">
        <span className="admin-sidebar__nav-label">Núcleo de controle</span>
        {navigation.map((item) => (
          <button
            className={`admin-sidebar__nav-item ${item.active ? "is-active" : ""}`}
            key={item.label}
            type="button"
            disabled={!item.active}
            title={!item.active ? "Será ativado nas próximas etapas" : undefined}
          >
            <span>{item.glyph}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="admin-sidebar__footer">
        <span className="signal-dot" />
        <div>
          <strong>Fundação ativa</strong>
          <small>Ambiente de desenvolvimento</small>
        </div>
        <Link href="/">Sair</Link>
      </div>
    </aside>
  );
}
