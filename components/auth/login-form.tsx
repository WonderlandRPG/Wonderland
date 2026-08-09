"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";

import { FieldError, FormNotice, SubmitButton } from "@/components/auth/form-parts";
import { getSignInErrorMessage } from "@/lib/auth/errors";
import { idleAuthState } from "@/lib/auth/forms";
import type { AuthActionState, AuthField } from "@/lib/auth/forms";
import { loginSchema } from "@/lib/auth/validation";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export function LoginForm({ nextPath }: { nextPath: string }) {
  const [state, setState] = useState<AuthActionState>(idleAuthState);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const formData = new FormData(event.currentTarget);
    const result = loginSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    if (!result.success) {
      setState({
        status: "error",
        message: "Revise os campos destacados antes de continuar.",
        fieldErrors: result.error.flatten().fieldErrors as Partial<Record<AuthField, string[]>>,
      });
      return;
    }

    const supabase = createBrowserSupabaseClient();

    if (!supabase) {
      setState({
        status: "error",
        message: "A conexão de contas ainda não está disponível. Tente novamente em instantes.",
      });
      return;
    }

    setPending(true);
    setState(idleAuthState);

    const { data, error } = await supabase.auth.signInWithPassword(result.data);

    if (error) {
      setPending(false);
      setState({ status: "error", message: getSignInErrorMessage(error) });
      return;
    }

    if (!data.session || !data.user) {
      setPending(false);
      setState({
        status: "error",
        message: "A senha foi aceita, mas a sessão não pôde ser iniciada. Tente novamente.",
      });
      return;
    }

    window.location.replace(nextPath);
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <input name="next" type="hidden" value={nextPath} />
      <FormNotice state={state} />

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

      <SubmitButton idleLabel="Entrar no Wonderland" pendingLabel="Entrando" pending={pending} />

      <p className="auth-form__switch">
        Ainda não tem uma conta? <Link href="/cadastro">Criar conta</Link>
      </p>
    </form>
  );
}
