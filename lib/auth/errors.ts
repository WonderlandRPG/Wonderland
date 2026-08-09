import type { AuthError } from "@supabase/supabase-js";

type PublicAuthError = Pick<AuthError, "code" | "message" | "status">;

export function getSignInErrorMessage(error: PublicAuthError) {
  if (error.status === 429 || error.code === "over_request_rate_limit") {
    return "Muitas tentativas foram feitas. Aguarde alguns minutos antes de tentar novamente.";
  }

  if (error.code === "email_not_confirmed") {
    return "Seu e-mail ainda não foi confirmado. Abra o link de confirmação enviado no cadastro.";
  }

  if (error.code === "user_banned") {
    return "Esta conta está temporariamente indisponível. Entre em contato com a equipe do Wonderland.";
  }

  return "E-mail ou senha incorretos. Confira os dados e tente novamente.";
}
