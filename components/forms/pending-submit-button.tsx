"use client";

import { useFormStatus } from "react-dom";

export function PendingSubmitButton({
  children,
  className,
  pendingLabel = "Salvando…",
}: {
  children: React.ReactNode;
  className: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button aria-busy={pending} className={className} disabled={pending} type="submit">
      {pending ? pendingLabel : children}
    </button>
  );
}
