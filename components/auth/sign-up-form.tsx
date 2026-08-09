"use client";

import Link from "next/link";
import { useActionState } from "react";

import { signUpAction } from "@/app/auth/actions";
import { FieldError, FormNotice, SubmitButton } from "@/components/auth/form-parts";
import { idleAuthState } from "@/lib/auth/forms";

export function SignUpForm() {
  const [state, action] = useActionState(signUpAction, idleAuthState);

  return (
    <form className="auth-form" action={action} noValidate>
      <FormNotice state={state} />

      <label className="form-field">
        <span>Nome de exibição</span>
        <input
          autoComplete="nickname"
          maxLength={32}
          name="displayName"
          placeholder="Como os jogadores verão você"
          aria-invalid={Boolean(state.fieldErrors?.displayName)}
          required
        />
        <FieldError state={state} field="displayName" />
      </label>

      <label className="form-field">
        <span>E-mail</span>
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

      <div className="auth-form__columns">
        <label className="form-field">
          <span>Senha</span>
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
          <span>Confirmar senha</span>
          <input
            autoComplete="new-password"
            minLength={8}
            name="confirmPassword"
            placeholder="Repita a senha"
            type="password"
            aria-invalid={Boolean(state.fieldErrors?.confirmPassword)}
            required
          />
          <FieldError state={state} field="confirmPassword" />
        </label>
      </div>

      <p className="password-hint">Use pelo menos 8 caracteres, incluindo uma letra e um número.</p>

      <label className="form-check">
        <input name="acceptedTerms" type="checkbox" />
        <span>
          Concordo em seguir as regras de convivência e autorizo o uso dos dados necessários para
          manter minha conta.
        </span>
      </label>
      <FieldError state={state} field="acceptedTerms" />

      <SubmitButton idleLabel="Criar minha conta" pendingLabel="Criando conta" />

      <p className="auth-form__switch">
        Já tem uma conta? <Link href="/">Entrar</Link>
      </p>
    </form>
  );
}
