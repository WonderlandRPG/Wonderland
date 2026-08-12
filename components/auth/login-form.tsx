"use client";

import Link from "next/link";
import { useActionState } from "react";

import { signInAction } from "@/app/auth/actions";
import { FieldError, FormNotice, SubmitButton } from "@/components/auth/form-parts";
import { idleAuthState } from "@/lib/auth/forms";

export function LoginForm({
  nextPath,
  maintenance = false,
}: {
  nextPath: string;
  maintenance?: boolean;
}) {
  const [state, action] = useActionState(signInAction, idleAuthState);

  return (
    <form className="auth-form" action={action} noValidate>
      <input name="next" type="hidden" value={nextPath} />
      <FormNotice state={state} />
      {maintenance ? (
        <div className="auth-maintenance-notice">
          <strong>Servidor em manutenção</strong>
          <span>
            O acesso comum está bloqueado. Administradores e Fundadores ainda podem entrar abaixo.
          </span>
        </div>
      ) : null}

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

      <label className="form-field">
        <span className="form-field__label-row">
          Senha
          <Link href="/recuperar-senha">Esqueci minha senha</Link>
        </span>
        <input
          autoComplete="current-password"
          name="password"
          placeholder="Digite sua senha"
          type="password"
          aria-invalid={Boolean(state.fieldErrors?.password)}
          required
        />
        <FieldError state={state} field="password" />
      </label>

      <SubmitButton idleLabel="Entrar no Wonderland" pendingLabel="Entrando" />

      <p className="auth-form__switch">
        Ainda não tem uma conta? <Link href="/cadastro">Criar conta</Link>
      </p>
    </form>
  );
}
