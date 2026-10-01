"use client";

import { useActionState, useRef, useState, type ReactNode } from "react";
import { unstable_rethrow } from "next/navigation";
import type { GameActionResult } from "@/lib/game/action-result";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import styles from "./inventory-action-form.module.css";

export function InventoryActionForm({
  action,
  children,
  confirmation,
}: {
  action: (formData: FormData) => Promise<GameActionResult>;
  children: ReactNode;
  confirmation?: { title: string; description: string; confirmLabel: string };
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const confirmed = useRef(false);
  const [confirming, setConfirming] = useState(false);
  const [result, submit, pending] = useActionState<GameActionResult, FormData>(
    async (_previous: GameActionResult, formData: FormData): Promise<GameActionResult> => {
      try {
        return await action(formData);
      } catch (error) {
        unstable_rethrow(error);
        return {
          status: "error",
          message: "A conexão falhou. Verifique o inventário antes de tentar novamente.",
        };
      }
    },
    { status: "idle", message: "" },
  );

  return (
    <form
      ref={formRef}
      action={submit}
      aria-busy={pending}
      onSubmit={(event) => {
        if (!confirmation) return;
        if (confirmed.current) {
          confirmed.current = false;
          return;
        }
        event.preventDefault();
        setConfirming(true);
      }}
    >
      <fieldset disabled={pending} className={styles.fields}>
        {children}
      </fieldset>
      {pending ? (
        <p role="status">Processando ação...</p>
      ) : result.status !== "idle" ? (
        <p
          role={result.status === "error" ? "alert" : "status"}
          data-wl-status={result.status === "error" ? "danger" : "success"}
        >
          {result.message}
        </p>
      ) : null}
      {confirmation ? (
        <ConfirmationDialog
          open={confirming}
          title={confirmation.title}
          description={confirmation.description}
          confirmLabel={confirmation.confirmLabel}
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            setConfirming(false);
            confirmed.current = true;
            formRef.current?.requestSubmit();
          }}
        />
      ) : null}
    </form>
  );
}
