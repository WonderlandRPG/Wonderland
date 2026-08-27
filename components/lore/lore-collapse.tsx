"use client";

import { useState } from "react";

export function LoreCollapse({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <section className="lore-collapse" data-collapsed={collapsed}>
      <header>
        <div>
          <small>HISTÓRIA OFICIAL</small>
          <strong>{collapsed ? "As eras estão minimizadas" : "As eras de Wonderland"}</strong>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          aria-expanded={!collapsed}
        >
          {collapsed ? "Mostrar história" : "Minimizar história"}
        </button>
      </header>
      {collapsed ? null : children}
    </section>
  );
}
