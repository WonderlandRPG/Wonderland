"use client";

import { useEffect, useState, useTransition } from "react";
import { cancelPvpQueueAction, joinPvpQueueAction, pollPvpQueueAction } from "@/app/arena/pvp-actions";

type QueueState = {
  queueId: string;
  status: "searching" | "matched" | "cancelled" | "expired";
  matchId?: string | null;
  opponent?: { id: string; name: string; level: number; rank: string; imageUrl?: string | null } | null;
};

export function PvpLobby({ characterId, characterName, rank }: { characterId: string; characterName: string; rank: string }) {
  const [queue, setQueue] = useState<QueueState | null>(null);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!queue || queue.status !== "searching") return;
    const timer = window.setInterval(() => {
      startTransition(async () => {
        const result = await pollPvpQueueAction(queue.queueId);
        if (result.ok) setQueue(result.data);
        else setMessage(result.message);
      });
    }, 2000);
    return () => window.clearInterval(timer);
  }, [queue]);

  function join() {
    setMessage("");
    startTransition(async () => {
      const result = await joinPvpQueueAction(characterId);
      if (result.ok) setQueue(result.data);
      else setMessage(result.message);
    });
  }
  function cancel() {
    if (!queue) return;
    startTransition(async () => {
      await cancelPvpQueueAction(queue.queueId);
      setQueue(null);
      setMessage("Busca cancelada.");
    });
  }

  const matched = queue?.status === "matched";
  return <section className={`pvp-lobby ${matched ? "is-matched" : ""}`}>
    <span className="pvp-lobby__crest">⚔</span><span className="eyebrow">Arena competitiva</span>
    <h1>{matched ? "Confronto encontrado" : "PvP de Wonderland"}</h1>
    <p>{matched ? "Os dois aventureiros foram conectados na mesma sala de duelo." : "A fila compara somente o Rank do personagem. Não há filtro de nível, classe ou reino."}</p>
    <div><article><small>Seu personagem</small><strong>{characterName}</strong></article><article><small>Balanceamento</small><strong>Somente Rank {rank}</strong></article><article><small>Formato</small><strong>Duelo 1 × 1</strong></article></div>
    {matched && queue.opponent ? <div className="pvp-match-card"><span className={queue.opponent.imageUrl ? "is-image" : ""} style={queue.opponent.imageUrl ? { backgroundImage: `url(${queue.opponent.imageUrl})` } : undefined}>{queue.opponent.imageUrl ? "" : queue.opponent.name.slice(0,2).toUpperCase()}</span><div><small>OPONENTE · RANK {queue.opponent.rank}</small><strong>{queue.opponent.name}</strong><p>Nível {queue.opponent.level}</p></div><b>VS</b></div> : null}
    {!queue || queue.status === "cancelled" || queue.status === "expired" ? <button className="button button--primary" disabled={pending} onClick={join} type="button">{pending ? "Entrando…" : `Buscar oponente Rank ${rank}`}</button> : null}
    {queue?.status === "searching" ? <><button className="button button--dark" disabled={pending} onClick={cancel} type="button">Cancelar busca</button><em><span className="signal-dot"/> Procurando outro personagem Rank {rank}…</em></> : null}
    {message ? <p className="arena-result__error">{message}</p> : null}
  </section>;
}
