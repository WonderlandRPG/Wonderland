"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";

import { FieldError, FormNotice, SubmitButton } from "@/components/auth/form-parts";
import { idleAuthState } from "@/lib/auth/forms";
import type { AuthActionState, AuthField } from "@/lib/auth/forms";
import { signUpSchema } from "@/lib/auth/validation";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export function SignUpForm() {
  const [state, setState] = useState<AuthActionState>(idleAuthState);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const formData = new FormData(event.currentTarget);
    const result = signUpSchema.safeParse({
      displayName: formData.get("displayName"),
      email: formData.get("email"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
      acceptedTerms: formData.get("acceptedTerms"),
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

    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("next", "/perfil?status=conta-confirmada");
    const { displayName, email, password } = result.data;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: callbackUrl.toString(),
      },
    });

    setPending(false);

    if (error) {
      setState({
        status: "error",
        message:
          error.status === 429
            ? "Muitas tentativas foram feitas. Aguarde alguns minutos antes de tentar novamente."
            : "Não foi possível criar a conta agora. Tente novamente em instantes.",
      });
      return;
    }

    if (data.session) {
      window.location.replace("/perfil?status=conta-criada");
      return;
    }

    setState({
      status: "success",
      message:
        "Cadastro recebido! Enviamos um link de confirmação para o seu e-mail. Abra-o para ativar a conta.",
    });
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
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

      <SubmitButton idleLabel="Criar minha conta" pendingLabel="Criando conta" pending={pending} />

      <p className="auth-form__switch">
        Já tem uma conta? <Link href="/">Entrar</Link>
      </p>
    </form>
  );
}
