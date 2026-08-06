"use client";

import Link from "next/link";
import { useActionState } from "react";

import { updatePasswordAction } from "@/app/auth/actions";
import { FieldError, FormNotice, SubmitButton } from "@/components/auth/form-parts";
import { idleAuthState } from "@/lib/auth/forms";

export function NewPasswordForm() {
  const [state, action] = useActionState(updatePasswordAction, idleAuthState);

  return (
    <form className="auth-form" action={action} noValidate>
      <FormNotice state={state} />

      <label className="form-field">
        <span>Nova senha</span>
        <input
          autoComplete="new-password"
          minLength={8}
          name="password"
          placeholder="Mínimo de 8 caracteres"
          type="password"
          aria-invalid={Boolean(state.fieldErrors?.password)}
          required
        />
        <FieldError state={state} field="password" />
      </label>

      <label className="form-field">
        <span>Confirmar nova senha</span>
        <input
          autoComplete="new-password"
          minLength={8}
          name="confirmPassword"
          placeholder="Repita a nova senha"
          type="password"
          aria-invalid={Boolean(state.fieldErrors?.confirmPassword)}
          required
        />
        <FieldError state={state} field="confirmPassword" />
      </label>

      <p className="password-hint">Use pelo menos 8 caracteres, incluindo uma letra e um número.</p>
      <SubmitButton idleLabel="Salvar nova senha" pendingLabel="Salvando" />

      <p className="auth-form__switch">
        O link não funciona? <Link href="/recuperar-senha">Solicitar outro</Link>
      </p>
    </form>
  );
}
