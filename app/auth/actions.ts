"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { AuthActionState, AuthField } from "@/lib/auth/forms";
import { getSignInErrorMessage } from "@/lib/auth/errors";
import { resolveRequestOrigin } from "@/lib/auth/origin";
import { getSafeRedirectPath } from "@/lib/auth/redirects";
import {
  loginSchema,
  newPasswordSchema,
  profileSchema,
  recoverySchema,
  signUpSchema,
} from "@/lib/auth/validation";
import { getConfiguredSiteUrl } from "@/lib/config/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function configurationError(): AuthActionState {
  return {
    status: "error",
    message: "A conexão de contas ainda não está disponível. Tente novamente em instantes.",
  };
}

function validationError(error: {
  flatten(): { fieldErrors: Record<string, string[] | undefined> };
}): AuthActionState {
  return {
    status: "error",
    message: "Revise os campos destacados antes de continuar.",
    fieldErrors: error.flatten().fieldErrors as Partial<Record<AuthField, string[]>>,
  };
}

async function getRequestOrigin() {
  const requestHeaders = await headers();

  return resolveRequestOrigin({
    forwardedHost: requestHeaders.get("x-forwarded-host"),
    host: requestHeaders.get("host"),
    forwardedProtocol: requestHeaders.get("x-forwarded-proto"),
    configuredUrl: getConfiguredSiteUrl(),
  });
}

async function getAuthCallbackUrl(nextPath: string) {
  const origin = await getRequestOrigin();
  const callbackUrl = new URL("/auth/callback", origin);
  callbackUrl.searchParams.set("next", getSafeRedirectPath(nextPath));
  return callbackUrl.toString();
}

export async function signInAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const result = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!result.success) return validationError(result.error);

  const supabase = await createServerSupabaseClient();

  if (!supabase) return configurationError();

  const { data, error } = await supabase.auth.signInWithPassword(result.data);

  if (error) {
    return {
      status: "error",
      message: getSignInErrorMessage(error),
    };
  }

  if (!data.session || !data.user) {
    return {
      status: "error",
      message: "A senha foi aceita, mas a sessão não pôde ser iniciada. Tente novamente.",
    };
  }

  const { data: verifiedIdentity, error: verificationError } = await supabase.auth.getUser();

  if (verificationError || verifiedIdentity.user?.id !== data.user.id) {
    await supabase.auth.signOut();

    return {
      status: "error",
      message: "Não foi possível confirmar a sessão criada. Atualize a página e tente novamente.",
    };
  }

  const nextPath = getSafeRedirectPath(String(formData.get("next") ?? ""));
  redirect(nextPath);
}

export async function signUpAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const result = signUpSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    acceptedTerms: formData.get("acceptedTerms"),
  });

  if (!result.success) return validationError(result.error);

  const supabase = await createServerSupabaseClient();

  if (!supabase) return configurationError();

  const { displayName, email, password } = result.data;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      emailRedirectTo: await getAuthCallbackUrl("/perfil?status=conta-confirmada"),
    },
  });

  if (error) {
    return {
      status: "error",
      message:
        error.status === 429
          ? "Muitas tentativas foram feitas. Aguarde alguns minutos antes de tentar novamente."
          : "Não foi possível criar a conta agora. Tente novamente em instantes.",
    };
  }

  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/perfil?status=conta-criada");
  }

  return {
    status: "success",
    message:
      "Cadastro recebido! Enviamos um link de confirmação para o seu e-mail. Abra-o para ativar a conta.",
  };
}

export async function requestPasswordResetAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const result = recoverySchema.safeParse({ email: formData.get("email") });

  if (!result.success) return validationError(result.error);

  const supabase = await createServerSupabaseClient();

  if (!supabase) return configurationError();

  const { error } = await supabase.auth.resetPasswordForEmail(result.data.email, {
    redirectTo: await getAuthCallbackUrl("/nova-senha"),
  });

  if (error?.status === 429) {
    return {
      status: "error",
      message: "Aguarde um minuto antes de solicitar outro e-mail de recuperação.",
    };
  }

  if (error) {
    return {
      status: "error",
      message: "Não foi possível enviar o link agora. Atualize a página e tente novamente.",
    };
  }

  return {
    status: "success",
    message:
      "Se existir uma conta com esse e-mail, você receberá um link para criar uma nova senha.",
  };
}

export async function updatePasswordAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const result = newPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!result.success) return validationError(result.error);

  const supabase = await createServerSupabaseClient();

  if (!supabase) return configurationError();

  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims?.sub) {
    return {
      status: "error",
      message: "Este link expirou ou já foi usado. Solicite uma nova recuperação de senha.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password: result.data.password });

  if (error) {
    return {
      status: "error",
      message: "Não foi possível atualizar a senha. Solicite um novo link e tente novamente.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/perfil?status=senha-alterada");
}

export async function updateProfileAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const result = profileSchema.safeParse({ displayName: formData.get("displayName") });

  if (!result.success) return validationError(result.error);

  const supabase = await createServerSupabaseClient();

  if (!supabase) return configurationError();

  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    return { status: "error", message: "Sua sessão expirou. Entre novamente para continuar." };
  }

  const { error } = await supabase
    .from("v2_profiles")
    .update({ display_name: result.data.displayName })
    .eq("user_id", userId);

  if (error) {
    return {
      status: "error",
      message: "Não foi possível salvar o perfil agora. Tente novamente em instantes.",
    };
  }

  revalidatePath("/perfil");
  revalidatePath("/admin");

  return { status: "success", message: "Seu nome de exibição foi atualizado." };
}

export async function signOutAction() {
  const supabase = await createServerSupabaseClient();

  if (supabase) {
    await supabase.auth.signOut();
  }

  revalidatePath("/", "layout");
  redirect("/?status=sessao-encerrada");
}
