"use client";

import { useEffect, useState, useTransition } from "react";
import {
  getCombatSurrenderStatusAction,
  requestCombatSurrenderAction,
} from "@/app/arena/surrender-actions";

type Status = { completed: boolean; votes: number; required: number; voted: boolean };

export function CombatSurrenderButton({
  kind,
  combatId,
  onCompleted,
}: {
  kind: "arena" | "pvp" | "dungeon";
  combatId: string;
  onCompleted?(): void;
}) {
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      const result = await getCombatSurrenderStatusAction(kind, combatId);
      if (cancelled || !result.ok) return;
      setStatus(result.data);
      if (result.data.completed) onCompleted?.();
    }
    void refresh();
    const timer = window.setInterval(() => void refresh(), 2500);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [kind, combatId, onCompleted]);

  function surrender() {
    if (pending || status?.completed || status?.voted) return;
    const warning = status && status.required > 1
      ? `Confirmar desistência? O combate só será encerrado quando todos os ${status.required} jogadores reais confirmarem. Todos sairão derrotados.`
      : "Tem certeza de que deseja desistir? O combate será encerrado e você sairá derrotado.";
    if (!window.confirm(warning)) return;
    setError("");
    startTransition(async () => {
      const result = await requestCombatSurrenderAction(kind, combatId);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setStatus(result.data);
      if (result.data.completed) onCompleted?.();
    });
  }

  if (status?.completed) return null;

  const progress = status && status.required > 1
    ? `${status.votes}/${status.required} confirmações`
    : "Você receberá uma derrota";

  return (
    <div className="combat-surrender">
      <button
        className="button button--danger combat-surrender__button"
        disabled={pending || Boolean(status?.voted)}
        onClick={surrender}
        type="button"
      >
        {pending
          ? "Confirmando…"
          : status?.voted
            ? "Desistência confirmada"
            : "Desistir do combate"}
      </button>
      <small>
        {status?.voted && status.required > 1
          ? `Aguardando os outros jogadores · ${progress}`
          : progress}
      </small>
      {error ? <span className="arena-result__error">{error}</span> : null}
    </div>
  );
}
