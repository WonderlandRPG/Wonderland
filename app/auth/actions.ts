"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { recoveryIntentCookieName } from "@/lib/auth/callback";
import type { AuthActionState, AuthField } from "@/lib/auth/forms";
import { newPasswordSchema, profileSchema } from "@/lib/auth/validation";
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

  (await cookies()).delete(recoveryIntentCookieName);
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
