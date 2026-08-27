"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markUpdateReadAction, markUpdateSeenAction } from "@/app/atualizacoes/actions";

export function UpdateNotification({
  update,
}: {
  update: { id: string; version: string; title: string };
}) {
  const [open, setOpen] = useState(true);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const markRead = () =>
    startTransition(async () => {
      await markUpdateReadAction(update.id);
      setOpen(false);
      router.push("/atualizacoes");
    });
  const dismiss = () =>
    startTransition(async () => {
      await markUpdateSeenAction(update.id);
      setOpen(false);
      router.refresh();
    });
  if (!open) return null;
  return (
    <div
      className="update-notification"
      role="dialog"
      aria-modal="true"
      aria-labelledby="update-notification-title"
    >
      <button
        className="update-notification__backdrop"
        aria-label="Fechar aviso"
        onClick={dismiss}
        type="button"
      />
      <section>
        <span>NOVA ATUALIZAÇÃO · v{update.version}</span>
        <h2 id="update-notification-title">{update.title}</h2>
        <p>Há novidades em Wonderland. Abra as notas para conhecer todas as mudanças.</p>
        <div>
          <button disabled={pending} type="button" onClick={dismiss}>
            Ver depois
          </button>
          <button disabled={pending} type="button" onClick={markRead}>
            {pending ? "Abrindo…" : "Ler atualização →"}
          </button>
        </div>
      </section>
    </div>
  );
}
