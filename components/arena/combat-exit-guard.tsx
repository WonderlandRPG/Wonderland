"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { CombatSurrenderButton } from "@/components/arena/combat-surrender-button";

type CombatKind = "arena" | "pvp" | "dungeon";

export function CombatExitGuard({ kind, combatId }: { kind: CombatKind; combatId: string }) {
  const sent = useRef(false);
  const router = useRouter();
  const onSurrenderCompleted = useCallback(() => {
    router.replace(kind === "dungeon" ? "/arena/dungeons" : "/arena");
  }, [kind, router]);

  useEffect(() => {
    sent.current = false;

    const finish = () => {
      if (sent.current) return;
      sent.current = true;
      const body = JSON.stringify({ kind, combatId });
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/combat/leave", new Blob([body], { type: "application/json" }));
      } else {
        void fetch("/api/combat/leave", {
          method: "POST",
          body,
          headers: { "content-type": "application/json" },
          credentials: "same-origin",
          keepalive: true,
        });
      }
    };

    const onDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      const element = event.target instanceof Element ? event.target : null;
      const anchor = element?.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      try {
        const destination = new URL(anchor.href, window.location.href);
        if (destination.origin !== window.location.origin) return;
        const current = new URL(window.location.href);
        if (destination.pathname === current.pathname && destination.search === current.search) return;
        finish();
      } catch {
        // Ignore malformed links and let the browser handle them normally.
      }
    };

    // pagehide/beforeunload cover real document exits; click/popstate cover
    // Next.js client-side navigation, which does not unload the document.
    window.addEventListener("pagehide", finish);
    window.addEventListener("beforeunload", finish);
    window.addEventListener("popstate", finish);
    document.addEventListener("click", onDocumentClick, true);

    return () => {
      window.removeEventListener("pagehide", finish);
      window.removeEventListener("beforeunload", finish);
      window.removeEventListener("popstate", finish);
      document.removeEventListener("click", onDocumentClick, true);
      // Intentionally do not call finish() here. React/Next can unmount and
      // remount the guard while the player is still inside the same fight.
    };
  }, [combatId, kind]);

  return (
    <CombatSurrenderButton
      kind={kind}
      combatId={combatId}
      onCompleted={onSurrenderCompleted}
    />
  );
}
