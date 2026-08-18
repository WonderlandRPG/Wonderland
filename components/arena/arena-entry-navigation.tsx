"use client";

import { useEffect, useState } from "react";

export function ArenaEntryNavigation() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const element = event.target instanceof Element ? event.target : null;
      const anchor = element?.closest<HTMLAnchorElement>("a.arena-mode-card");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      event.preventDefault();
      setLoading(true);

      // The combat modes live on the same /arena route with different search
      // params. A hard navigation avoids stalled RSC transitions on some
      // browsers and gives every combat a clean client runtime.
      window.location.assign(anchor.href);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  if (!loading) return null;

  return (
    <div className="arena-entry-overlay" role="status" aria-live="assertive">
      <div>
        <span>⚔</span>
        <small>PREPARANDO COMBATE</small>
        <strong>Carregando a Arena…</strong>
        <p>Aguarde enquanto a ficha e o modo de combate são preparados.</p>
      </div>
    </div>
  );
}
