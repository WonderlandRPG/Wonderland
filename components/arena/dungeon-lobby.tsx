"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import {
  getDungeonQueueAction,
  joinDungeonQueueAction,
  leaveDungeonQueueAction,
  startDungeonAction,
  type DungeonQueueEntry,
} from "@/app/arena/dungeons/actions";
import styles from "./dungeon-lobby.module.css";

export function DungeonLobby({
  dungeonKey,
  characterId,
  userId,
  minimumPlayers,
  initialQueue,
}: {
  dungeonKey: string;
  characterId: string;
  userId: string;
  minimumPlayers: number;
  initialQueue: DungeonQueueEntry[];
}) {
  const [queue, setQueue] = useState(initialQueue);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const joined = queue.some((entry) => entry.userId === userId);
  const ready = queue.length >= minimumPlayers;

  const refresh = useCallback(() => {
    void getDungeonQueueAction(dungeonKey).then((result) => {
      if (result.ok) setQueue(result.data);
    });
  }, [dungeonKey]);

  useEffect(() => {
    const client = createBrowserSupabaseClient();
    if (!client) return;
    const channel = client
      .channel(`dungeon-queue:${dungeonKey}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "v2_dungeon_queue",
          filter: `dungeon_key=eq.${dungeonKey}`,
        },
        refresh,
      )
      .subscribe();
    const fallback = window.setInterval(refresh, 10_000);
    return () => {
      window.clearInterval(fallback);
      void client.removeChannel(channel);
    };
  }, [dungeonKey, refresh]);

  function joinOrLeave() {
    setMessage("");
    startTransition(async () => {
      const result = joined
        ? await leaveDungeonQueueAction(dungeonKey)
        : await joinDungeonQueueAction(dungeonKey, characterId);
      if (result.ok) setQueue(result.data);
      else setMessage(result.message);
    });
  }

  function start(force: boolean) {
    setMessage("");
    startTransition(async () => {
      const result = await startDungeonAction(dungeonKey, force);
      if (!result.ok) return setMessage(result.message);
      setQueue([]);
      setMessage(
        `Expedição iniciada com ${result.data.partySize} jogador(es)${result.data.forced ? " por início forçado" : ""}.`,
      );
    });
  }

  return (
    <section className={styles.lobby}>
      <div className="dungeon-party-panel">
        <div className="dungeon-party-ring">
          <span>{queue.length}</span>
          <small>NA FILA</small>
        </div>
        <div>
          <span className="eyebrow">Fila cooperativa ao vivo</span>
          <h2>{ready ? "Grupo pronto para partir" : "Aguardando aventureiros"}</h2>
          <p>
            Entre na fila para reservar seu lugar. A expedição normal exige {minimumPlayers}{" "}
            jogadores.
          </p>
        </div>
        <div className={styles.actions}>
          <button
            className={`button ${joined ? "button--dark" : "button--primary"}`}
            disabled={pending}
            onClick={joinOrLeave}
            type="button"
          >
            {pending ? "Atualizando…" : joined ? "Sair da fila" : "Entrar na fila"}
          </button>
          <button
            className="button button--primary"
            disabled={pending || !ready}
            onClick={() => start(false)}
            type="button"
          >
            Iniciar Dungeon
          </button>
          <button
            className={`button ${styles.force}`}
            disabled={pending || queue.length === 0}
            onClick={() => start(true)}
            type="button"
          >
            ⚡ Forçar início · ADM
          </button>
        </div>
      </div>
      <div className={styles.list}>
        <header>
          <div>
            <span className="eyebrow">Formação atual</span>
            <h2>Jogadores na fila</h2>
          </div>
          <strong>
            <i /> AO VIVO
          </strong>
        </header>
        {queue.length ? (
          <ol>
            {queue.map((entry, index) => (
              <li key={entry.id}>
                <b>{String(index + 1).padStart(2, "0")}</b>
                <span
                  className={styles.avatar}
                  style={entry.imageUrl ? { backgroundImage: `url(${entry.imageUrl})` } : undefined}
                >
                  {entry.imageUrl ? "" : entry.name.slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <strong>{entry.name}</strong>
                  <small>
                    Nível {entry.level} · Rank {entry.rank}
                  </small>
                </div>
                {entry.userId === userId ? <em>VOCÊ</em> : <em>PRONTO</em>}
              </li>
            ))}
          </ol>
        ) : (
          <p className={styles.empty}>
            A fila está vazia. Clique em “Entrar na fila” para ser o primeiro aventureiro.
          </p>
        )}
        {message ? (
          <p className={styles.message} role="status">
            {message}
          </p>
        ) : null}
      </div>
    </section>
  );
}
