"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";

import { FieldError, FormNotice, SubmitButton } from "@/components/auth/form-parts";
import { recoveryIntentCookieName } from "@/lib/auth/callback";
import { idleAuthState } from "@/lib/auth/forms";
import type { AuthActionState, AuthField } from "@/lib/auth/forms";
import { recoverySchema } from "@/lib/auth/validation";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export function RecoveryForm() {
  const [state, setState] = useState<AuthActionState>(idleAuthState);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const formData = new FormData(event.currentTarget);
    const result = recoverySchema.safeParse({ email: formData.get("email") });

    if (!result.success) {
      setState({
        status: "error",
        message: "Revise o e-mail antes de continuar.",
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
    callbackUrl.searchParams.set("next", "/nova-senha");

    const { error } = await supabase.auth.resetPasswordForEmail(result.data.email, {
      redirectTo: callbackUrl.toString(),
    });

    setPending(false);

    if (error?.status === 429) {
      setState({
        status: "error",
        message: "Aguarde um minuto antes de solicitar outro e-mail de recuperação.",
      });
      return;
    }

    if (error) {
      setState({
        status: "error",
        message: "Não foi possível enviar o link agora. Atualize a página e tente novamente.",
      });
      return;
    }

    document.cookie = [
      `${recoveryIntentCookieName}=1`,
      "Max-Age=3600",
      "Path=/",
      "SameSite=Lax",
      ...(window.location.protocol === "https:" ? ["Secure"] : []),
    ].join("; ");

    setState({
      status: "success",
      message:
        "Se existir uma conta com esse e-mail, você receberá um link para criar uma nova senha.",
    });
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
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

      <SubmitButton
        idleLabel="Enviar link de recuperação"
        pendingLabel="Enviando"
        pending={pending}
      />

      <p className="auth-form__switch">
        Lembrou a senha? <Link href="/">Voltar para o login</Link>
      </p>
    </form>
  );
}
