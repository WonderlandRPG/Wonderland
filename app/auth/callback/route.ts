import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { getSafeRedirectPath } from "@/lib/auth/redirects";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const otpTypes: EmailOtpType[] = [
  "email",
  "recovery",
  "invite",
  "magiclink",
  "email_change",
  "signup",
];

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const requestedType = url.searchParams.get("type");
  const nextPath = getSafeRedirectPath(url.searchParams.get("next"));
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return NextResponse.redirect(new URL("/?status=configuracao-indisponivel", url));
  }

  let error: Error | null = null;

  if (code) {
    const result = await supabase.auth.exchangeCodeForSession(code);
    error = result.error;
  } else if (tokenHash && requestedType && otpTypes.includes(requestedType as EmailOtpType)) {
    const result = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: requestedType as EmailOtpType,
    });
    error = result.error;
  } else {
    error = new Error("Link de autenticação incompleto.");
  }

  if (error) {
    return NextResponse.redirect(new URL("/?status=link-invalido", url));
  }

  return NextResponse.redirect(new URL(nextPath, url));
}
