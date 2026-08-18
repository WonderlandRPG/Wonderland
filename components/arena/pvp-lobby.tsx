"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  cancelPvpQueueAction,
  joinPvpQueueAction,
  pollPvpQueueAction,
} from "@/app/arena/pvp-actions";

type QueueCharacter = {
  id: string;
  name: string;
  level: number;
  rank: string;
  imageUrl?: string | null;
};

type QueueState = {
  queueId: string;
  status: "searching" | "matched" | "cancelled" | "expired";
  format: "solo" | "duo";
  matchId?: string | null;
  secondaryCharacter?: QueueCharacter | null;
  opponent?: QueueCharacter | null;
  opponentSecondary?: QueueCharacter | null;
};

export function PvpLobby({
  characterId,
  characterName,
  rank,
}: {
  characterId: string;
  characterName: string;
  rank: string;
}) {
  const [queue, setQueue] = useState<QueueState | null>(null);
  const [format, setFormat] = useState<"solo" | "duo">("solo");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    if (queue?.status === "matched" && queue.matchId) {
      if (queue.format === "duo") router.replace(`/arena/pvp-duo/${queue.matchId}`);
      else router.replace(`/arena?modo=pvp&partida=${queue.matchId}`);
      router.refresh();
    }
  }, [queue, router]);

  useEffect(() => {
    if (!queue || queue.status !== "searching") return;
    const timer = window.setInterval(() => {
      startTransition(async () => {
        const result = await pollPvpQueueAction(queue.queueId);
        if (result.ok) setQueue(result.data);
        else setMessage(result.message);
      });
    }, 1500);
    return () => window.clearInterval(timer);
  }, [queue]);

  function join(selectedFormat: "solo" | "duo") {
    setMessage("");
    setFormat(selectedFormat);
    startTransition(async () => {
      const result = await joinPvpQueueAction(characterId, selectedFormat);
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
  const activeFormat = queue?.format ?? format;
  return (
    <section className={`pvp-lobby ${matched ? "is-matched" : ""}`}>
      <span className="pvp-lobby__crest">⚔</span>
      <span className="eyebrow">Arena competitiva</span>
      <h1>{matched ? "Confronto encontrado" : "Escolha sua fila PvP"}</h1>
      <p>
        {matched
          ? activeFormat === "duo"
            ? "As duas duplas foram formadas. Abrindo o campo 2x2…"
            : "Sala criada. Abrindo o duelo Solo…"
          : "As filas são separadas por Rank para manter partidas equilibradas."}
      </p>

      {!queue || queue.status === "cancelled" || queue.status === "expired" ? (
        <div className="pvp-format-grid">
          <button
            className={`pvp-format-card ${format === "solo" ? "is-selected" : ""}`}
            disabled={pending}
            onClick={() => join("solo")}
            type="button"
          >
            <span>1 × 1</span>
            <strong>Fila Solo</strong>
            <small>Seu personagem contra outro aventureiro do mesmo Rank.</small>
            <b>{pending && format === "solo" ? "Entrando…" : "Buscar duelo"}</b>
          </button>
          <button
            className={`pvp-format-card is-duo ${format === "duo" ? "is-selected" : ""}`}
            disabled={pending}
            onClick={() => join("duo")}
            type="button"
          >
            <span>2 × 2</span>
            <strong>Fila de Duplas</strong>
            <small>Usa seu personagem ativo + outro personagem da sua conta com o mesmo Rank.</small>
            <b>{pending && format === "duo" ? "Entrando…" : "Buscar 2x2"}</b>
          </button>
        </div>
      ) : null}

      <div className="pvp-lobby__facts">
        <article>
          <small>Seu personagem</small>
          <strong>{characterName}</strong>
        </article>
        <article>
          <small>Balanceamento</small>
          <strong>Somente Rank {rank}</strong>
        </article>
        <article>
          <small>Formato atual</small>
          <strong>{activeFormat === "duo" ? "Duplas 2 × 2" : "Solo 1 × 1"}</strong>
        </article>
      </div>

      {queue?.status === "searching" && queue.secondaryCharacter ? (
        <div className="pvp-duo-partner">
          <small>SEU PARCEIRO DE EQUIPE</small>
          <strong>{queue.secondaryCharacter.name}</strong>
          <span>Lv. {queue.secondaryCharacter.level} · Rank {queue.secondaryCharacter.rank}</span>
        </div>
      ) : null}

      {matched && queue.opponent ? (
        <div className="pvp-match-card">
          <span
            className={queue.opponent.imageUrl ? "is-image" : ""}
            style={queue.opponent.imageUrl ? { backgroundImage: `url(${queue.opponent.imageUrl})` } : undefined}
          >
            {queue.opponent.imageUrl ? "" : queue.opponent.name.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <small>OPONENTE · RANK {queue.opponent.rank}</small>
            <strong>{queue.opponent.name}</strong>
            {queue.opponentSecondary ? <p>Dupla com {queue.opponentSecondary.name}</p> : <p>Preparando a Arena…</p>}
          </div>
          <b>VS</b>
        </div>
      ) : null}

      {queue?.status === "searching" ? (
        <>
          <button className="button button--dark" disabled={pending} onClick={cancel} type="button">
            Cancelar busca
          </button>
          <em>
            <span className="signal-dot" /> Procurando {activeFormat === "duo" ? "outra dupla" : "outro personagem"} Rank {rank}…
          </em>
        </>
      ) : null}
      {message ? <p className="arena-result__error">{message}</p> : null}
    </section>
  );
}
