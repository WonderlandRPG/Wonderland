"use client";

import Link from "next/link";
import { useActionState } from "react";

import { requestPasswordResetAction } from "@/app/auth/actions";
import { FieldError, FormNotice, SubmitButton } from "@/components/auth/form-parts";
import { idleAuthState } from "@/lib/auth/forms";

export function RecoveryForm() {
  const [state, action] = useActionState(requestPasswordResetAction, idleAuthState);

  return (
    <form className="auth-form" action={action} noValidate>
      <FormNotice state={state} />

      <label className="form-field">
        <span>E-mail da conta</span>
        <input
          autoComplete="email"
          inputMode="email"
          name="email"
          placeholder="voce@exemplo.com"
          type="email"
          aria-invalid={Boolean(state.fieldErrors?.email)}
          required
        />
        <FieldError state={state} field="email" />
      </label>

      <SubmitButton idleLabel="Enviar link de recuperação" pendingLabel="Enviando" />

      <p className="auth-form__switch">
        Lembrou a senha? <Link href="/entrar">Voltar para o login</Link>
      </p>
    </form>
  );
}
