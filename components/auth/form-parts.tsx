"use client";

import { useFormStatus } from "react-dom";

import type { AuthActionState, AuthField } from "@/lib/auth/forms";

export function FieldError({ state, field }: { state: AuthActionState; field: AuthField }) {
  const errors = state.fieldErrors?.[field];

  if (!errors?.length) return null;

  return (
    <span className="form-field__error" role="alert">
      {errors[0]}
    </span>
  );
}

export function FormNotice({ state }: { state: AuthActionState }) {
  if (state.status === "idle" || !state.message) return null;

  return (
    <div
      className={`form-notice form-notice--${state.status}`}
      data-sfx-on-mount={state.status === "success" ? "confirm" : "error"}
      role={state.status === "error" ? "alert" : "status"}
    >
      <span aria-hidden="true">{state.status === "success" ? "✓" : "!"}</span>
      <p>{state.message}</p>
    </div>
  );
}

export function SubmitButton({
  idleLabel,
  pendingLabel,
  pending: externalPending,
}: {
  idleLabel: string;
  pendingLabel: string;
  pending?: boolean;
}) {
  const { pending: formPending } = useFormStatus();
  const pending = externalPending ?? formPending;

  return (
    <button className="button button--primary auth-submit" type="submit" disabled={pending}>
      {pending ? pendingLabel : idleLabel}
      <span aria-hidden="true">{pending ? "…" : "→"}</span>
    </button>
  );
}
