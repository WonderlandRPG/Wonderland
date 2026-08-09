import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { LoginScreen } from "@/components/auth/login-screen";
import { getAuthCallbackPath, recoveryIntentCookieName } from "@/lib/auth/callback";

export const metadata: Metadata = { title: "Entrar" };

export const dynamic = "force-dynamic";

interface HomePageProps {
  searchParams: Promise<{
    code?: string;
    token_hash?: string;
    type?: string;
    next?: string;
    sb_flow_id?: string;
    status?: string;
  }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const recoveryPending = (await cookies()).get(recoveryIntentCookieName)?.value === "1";
  const callbackPath = getAuthCallbackPath({
    ...params,
    next: params.next || (recoveryPending ? "/nova-senha" : undefined),
  });

  if (callbackPath) redirect(callbackPath);

  return <LoginScreen next={params.next} status={params.status} />;
}
