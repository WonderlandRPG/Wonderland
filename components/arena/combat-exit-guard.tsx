"use client";

import { useEffect, useRef } from "react";

type CombatKind = "arena" | "pvp" | "dungeon";

export function CombatExitGuard({ kind, combatId }: { kind: CombatKind; combatId: string }) {
  const sent = useRef(false);

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
    window.addEventListener("pagehide", finish);
    return () => {
      window.removeEventListener("pagehide", finish);
      finish();
    };
  }, [combatId, kind]);

  return null;
}
